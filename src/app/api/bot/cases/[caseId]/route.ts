import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import Database from 'better-sqlite3';

// Path to the moderation database
const DB_PATH = '/home/vpcommunityorganisation/CO-Gov-Utils/data/moderation.db';

// Allowed roles for case management
const ALLOWED_ROLES = [
    'Senior Administration',
    'Developer', 
    'President',
    'Chief of Staff',
    'Vice President',
];

export async function GET(
    request: Request,
    { params }: { params: Promise<{ caseId: string }> }
) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.isLoggedIn || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { caseId } = await params;

        const db = new Database(DB_PATH, { readonly: true });
        const caseData = db.prepare('SELECT * FROM cases WHERE case_id = ?').get(caseId);
        db.close();

        if (!caseData) {
            return NextResponse.json({ error: 'Case not found' }, { status: 404 });
        }

        return NextResponse.json(caseData);
    } catch (error) {
        console.error('Error fetching case:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ caseId: string }> }
) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        
        if (!session.isLoggedIn || !session.user) {
            return NextResponse.json({ error: 'Unauthorized - Not logged in' }, { status: 401 });
        }

        // Check roles
        const userRoles = session.user.roles || [];
        const hasPermission = ALLOWED_ROLES.some(role => userRoles.includes(role)) || 
                              (session.user.authorityLevel && session.user.authorityLevel >= 4);
        
        if (!hasPermission) {
            return NextResponse.json({ 
                error: 'Insufficient permissions - Senior Admin+ required' 
            }, { status: 403 });
        }

        const { caseId } = await params;
        const deletedBy = session.user.discordId || session.user.email || 'unknown';

        const db = new Database(DB_PATH);
        
        // Soft delete - set deleted_at and deleted_by
        const result = db.prepare(`
            UPDATE cases 
            SET deleted_at = datetime('now'), 
                deleted_by = ?,
                status = 'deleted'
            WHERE case_id = ? AND deleted_at IS NULL
        `).run(deletedBy, caseId);
        
        db.close();

        if (result.changes === 0) {
            return NextResponse.json({ error: 'Case not found or already deleted' }, { status: 404 });
        }

        console.log(`[CASE DELETE] Case ${caseId} deleted by ${session.user.displayName} (${deletedBy})`);
        return NextResponse.json({ success: true, message: 'Case deleted' });
    } catch (error) {
        console.error('Error deleting case:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
