import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database path - shared data directory
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'appeals.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS appeals (
        id TEXT PRIMARY KEY,
        discord_id TEXT NOT NULL,
        discord_username TEXT,
        email TEXT NOT NULL,
        appeal_type TEXT NOT NULL DEFAULT 'ban',
        ban_reason TEXT,
        appeal_message TEXT NOT NULL,
        evidence TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        priority TEXT DEFAULT 'normal',
        assigned_to TEXT,
        reviewed_by TEXT,
        reviewed_at TEXT,
        review_note TEXT,
        internal_notes TEXT,
        ip_address TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS appeal_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appeal_id TEXT NOT NULL,
        sender_type TEXT NOT NULL,
        sender_id TEXT,
        sender_name TEXT,
        message TEXT NOT NULL,
        is_internal INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (appeal_id) REFERENCES appeals(id)
    );

    CREATE TABLE IF NOT EXISTS appeal_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        appeal_id TEXT NOT NULL,
        action TEXT NOT NULL,
        old_value TEXT,
        new_value TEXT,
        performed_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (appeal_id) REFERENCES appeals(id)
    );

    CREATE INDEX IF NOT EXISTS idx_appeals_discord_id ON appeals(discord_id);
    CREATE INDEX IF NOT EXISTS idx_appeals_status ON appeals(status);
    CREATE INDEX IF NOT EXISTS idx_appeals_created ON appeals(created_at);
    CREATE INDEX IF NOT EXISTS idx_appeal_messages_appeal ON appeal_messages(appeal_id);
`);

// Types
export interface Appeal {
    id: string;
    discord_id: string;
    discord_username: string | null;
    email: string;
    appeal_type: string;
    ban_reason: string | null;
    appeal_message: string;
    evidence: string | null;
    status: 'pending' | 'under_review' | 'approved' | 'denied' | 'escalated';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    assigned_to: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    review_note: string | null;
    internal_notes: string | null;
    ip_address: string | null;
    created_at: string;
    updated_at: string;
}

export interface AppealMessage {
    id: number;
    appeal_id: string;
    sender_type: 'user' | 'staff' | 'system';
    sender_id: string | null;
    sender_name: string | null;
    message: string;
    is_internal: boolean;
    created_at: string;
}

export interface AppealHistory {
    id: number;
    appeal_id: string;
    action: string;
    old_value: string | null;
    new_value: string | null;
    performed_by: string | null;
    created_at: string;
}

// Generate appeal ID
export function generateAppealId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'APL-';
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// Create appeal
export function createAppeal(data: {
    discord_id: string;
    discord_username?: string;
    email: string;
    appeal_type: string;
    ban_reason?: string;
    appeal_message: string;
    evidence?: string;
    ip_address?: string;
}): Appeal | null {
    try {
        const id = generateAppealId();
        const stmt = db.prepare(`
            INSERT INTO appeals (id, discord_id, discord_username, email, appeal_type, ban_reason, appeal_message, evidence, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(id, data.discord_id, data.discord_username || null, data.email, data.appeal_type, data.ban_reason || null, data.appeal_message, data.evidence || null, data.ip_address || null);
        
        // Log creation
        logHistory(id, 'CREATED', null, 'pending', null);
        
        return getAppealById(id);
    } catch (error) {
        console.error('Create appeal error:', error);
        return null;
    }
}

// Get appeal by ID
export function getAppealById(id: string): Appeal | null {
    const stmt = db.prepare('SELECT * FROM appeals WHERE id = ?');
    return stmt.get(id) as Appeal | null;
}

// Get appeal by Discord ID (pending)
export function getPendingAppealByDiscordId(discordId: string): Appeal | null {
    const stmt = db.prepare('SELECT * FROM appeals WHERE discord_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1');
    return stmt.get(discordId, 'pending') as Appeal | null;
}

// List appeals with filters
export function listAppeals(options: {
    status?: string;
    priority?: string;
    assignedTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
} = {}): { appeals: Appeal[]; total: number } {
    let where = '1=1';
    const params: any[] = [];

    if (options.status && options.status !== 'all') {
        where += ' AND status = ?';
        params.push(options.status);
    }

    if (options.priority && options.priority !== 'all') {
        where += ' AND priority = ?';
        params.push(options.priority);
    }

    if (options.assignedTo) {
        where += ' AND assigned_to = ?';
        params.push(options.assignedTo);
    }

    if (options.search) {
        where += ' AND (discord_id LIKE ? OR discord_username LIKE ? OR email LIKE ? OR id LIKE ?)';
        const searchTerm = `%${options.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM appeals WHERE ${where}`);
    const total = (countStmt.get(...params) as { count: number }).count;

    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const stmt = db.prepare(`
        SELECT * FROM appeals 
        WHERE ${where} 
        ORDER BY 
            CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END,
            created_at DESC 
        LIMIT ? OFFSET ?
    `);
    const appeals = stmt.all(...params, limit, offset) as Appeal[];

    return { appeals, total };
}

// Update appeal
export function updateAppeal(id: string, data: Partial<Appeal>, performedBy?: string): boolean {
    try {
        const current = getAppealById(id);
        if (!current) return false;

        const updates: string[] = [];
        const params: any[] = [];

        for (const [key, value] of Object.entries(data)) {
            if (key !== 'id' && key !== 'created_at') {
                updates.push(`${key} = ?`);
                params.push(value);

                // Log status/priority changes
                if (key === 'status' && value !== current.status) {
                    logHistory(id, 'STATUS_CHANGED', current.status, value as string, performedBy);
                }
                if (key === 'priority' && value !== current.priority) {
                    logHistory(id, 'PRIORITY_CHANGED', current.priority, value as string, performedBy);
                }
                if (key === 'assigned_to' && value !== current.assigned_to) {
                    logHistory(id, 'ASSIGNED', current.assigned_to, value as string, performedBy);
                }
            }
        }

        updates.push('updated_at = datetime("now")');
        params.push(id);

        const stmt = db.prepare(`UPDATE appeals SET ${updates.join(', ')} WHERE id = ?`);
        stmt.run(...params);
        return true;
    } catch (error) {
        console.error('Update appeal error:', error);
        return false;
    }
}

// Add message to appeal
export function addAppealMessage(data: {
    appeal_id: string;
    sender_type: 'user' | 'staff' | 'system';
    sender_id?: string;
    sender_name?: string;
    message: string;
    is_internal?: boolean;
}): AppealMessage | null {
    try {
        const stmt = db.prepare(`
            INSERT INTO appeal_messages (appeal_id, sender_type, sender_id, sender_name, message, is_internal)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(data.appeal_id, data.sender_type, data.sender_id || null, data.sender_name || null, data.message, data.is_internal ? 1 : 0);
        
        const getStmt = db.prepare('SELECT * FROM appeal_messages WHERE id = ?');
        return getStmt.get(result.lastInsertRowid) as AppealMessage | null;
    } catch (error) {
        console.error('Add message error:', error);
        return null;
    }
}

// Get messages for appeal
export function getAppealMessages(appealId: string, includeInternal: boolean = false): AppealMessage[] {
    let query = 'SELECT * FROM appeal_messages WHERE appeal_id = ?';
    if (!includeInternal) {
        query += ' AND is_internal = 0';
    }
    query += ' ORDER BY created_at ASC';
    
    const stmt = db.prepare(query);
    return stmt.all(appealId) as AppealMessage[];
}

// Log history
export function logHistory(appealId: string, action: string, oldValue: string | null, newValue: string | null, performedBy: string | null): void {
    try {
        const stmt = db.prepare(`
            INSERT INTO appeal_history (appeal_id, action, old_value, new_value, performed_by)
            VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run(appealId, action, oldValue, newValue, performedBy);
    } catch (error) {
        console.error('Log history error:', error);
    }
}

// Get appeal history
export function getAppealHistory(appealId: string): AppealHistory[] {
    const stmt = db.prepare('SELECT * FROM appeal_history WHERE appeal_id = ? ORDER BY created_at DESC');
    return stmt.all(appealId) as AppealHistory[];
}

// Get appeal stats
export function getAppealStats(): {
    total: number;
    pending: number;
    under_review: number;
    approved: number;
    denied: number;
    escalated: number;
    avgResponseTime: number;
} {
    const stats = db.prepare(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'under_review' THEN 1 ELSE 0 END) as under_review,
            SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
            SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) as denied,
            SUM(CASE WHEN status = 'escalated' THEN 1 ELSE 0 END) as escalated
        FROM appeals
    `).get() as any;

    // Calculate avg response time for resolved appeals
    const avgTime = db.prepare(`
        SELECT AVG(julianday(reviewed_at) - julianday(created_at)) * 24 as hours
        FROM appeals 
        WHERE reviewed_at IS NOT NULL
    `).get() as { hours: number | null };

    return {
        ...stats,
        avgResponseTime: avgTime.hours || 0
    };
}

export default db;
