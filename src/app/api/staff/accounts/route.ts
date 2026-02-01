import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import Database from 'better-sqlite3';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const AUTH_DB_PATH = '/var/lib/usgrp-auth/auth.db';

// Authority level labels
const authorityLabels: Record<number, string> = {
    0: 'User',
    1: 'Verified',
    2: 'Moderator',
    3: 'Admin',
    4: 'Senior Admin',
    5: 'Superuser',
    6: 'Developer',
};

export async function GET(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        const user = session.user;

        if (!user || !user.userId) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Only Admin+ can view staff accounts
        if ((user.authorityLevel || 0) < 3) {
            return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
        }

        const db = new Database(AUTH_DB_PATH, { readonly: true });

        const users = db.prepare(`
            SELECT 
                id, email, discord_id, display_name, authority_level,
                roles, permissions, enabled, suspended, totp_enabled,
                created_at, updated_at
            FROM users
            ORDER BY authority_level DESC, display_name ASC
        `).all();

        db.close();

        return NextResponse.json({
            ok: true,
            accounts: users.map((u: any) => ({
                id: u.id,
                email: u.email,
                discordId: u.discord_id,
                displayName: u.display_name,
                authorityLevel: u.authority_level,
                authorityLabel: authorityLabels[u.authority_level] || 'Unknown',
                roles: JSON.parse(u.roles || '[]'),
                permissions: JSON.parse(u.permissions || '[]'),
                enabled: !!u.enabled,
                suspended: !!u.suspended,
                totpEnabled: !!u.totp_enabled,
                createdAt: u.created_at,
                updatedAt: u.updated_at,
            })),
            stats: {
                total: users.length,
                admins: users.filter((u: any) => u.authority_level >= 3).length,
                mfaEnabled: users.filter((u: any) => u.totp_enabled).length,
            }
        });
    } catch (error) {
        console.error('Staff accounts fetch error:', error);
        return NextResponse.json({ ok: false, error: 'Failed to fetch staff accounts' }, { status: 500 });
    }
}

// Create new account
export async function POST(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        const user = session.user;

        if (!user || !user.userId) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Only Admin+ can create accounts
        if ((user.authorityLevel || 0) < 3) {
            return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
        }

        const { email, displayName, discordId, password, authorityLevel } = await request.json();

        if (!email || !displayName || !password) {
            return NextResponse.json({ ok: false, error: 'Email, display name, and password are required' }, { status: 400 });
        }

        // Can't create accounts with higher authority than yourself
        const targetLevel = authorityLevel ?? 0;
        if (targetLevel > (user.authorityLevel || 0)) {
            return NextResponse.json({ ok: false, error: 'Cannot create account with higher authority than yourself' }, { status: 403 });
        }

        const db = new Database(AUTH_DB_PATH);

        // Check if email already exists
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
        if (existing) {
            db.close();
            return NextResponse.json({ ok: false, error: 'Email already exists' }, { status: 400 });
        }

        const id = randomUUID();
        const passwordHash = await bcrypt.hash(password, 12);
        const now = new Date().toISOString();

        db.prepare(`
            INSERT INTO users (id, email, password_hash, discord_id, display_name, authority_level, roles, permissions, enabled, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, '[]', '[]', 1, ?, ?)
        `).run(id, email.toLowerCase(), passwordHash, discordId || null, displayName, targetLevel, now, now);

        db.close();

        return NextResponse.json({
            ok: true,
            account: { id, email: email.toLowerCase(), displayName, authorityLevel: targetLevel }
        });
    } catch (error) {
        console.error('Create account error:', error);
        return NextResponse.json({ ok: false, error: 'Failed to create account' }, { status: 500 });
    }
}

// Update account
export async function PUT(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        const user = session.user;

        if (!user || !user.userId) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Only Admin+ can update accounts
        if ((user.authorityLevel || 0) < 3) {
            return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
        }

        const { userId, email, displayName, discordId, password, authorityLevel, enabled } = await request.json();

        if (!userId) {
            return NextResponse.json({ ok: false, error: 'User ID required' }, { status: 400 });
        }

        const db = new Database(AUTH_DB_PATH);

        // Get target user
        const target = db.prepare('SELECT authority_level FROM users WHERE id = ?').get(userId) as any;
        if (!target) {
            db.close();
            return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
        }

        // Can't edit users with higher or equal authority (unless you're editing yourself)
        if (userId !== user.userId && target.authority_level >= (user.authorityLevel || 0)) {
            db.close();
            return NextResponse.json({ ok: false, error: 'Cannot edit user with equal or higher authority' }, { status: 403 });
        }

        // Can't set authority higher than yourself
        if (authorityLevel !== undefined && authorityLevel > (user.authorityLevel || 0)) {
            db.close();
            return NextResponse.json({ ok: false, error: 'Cannot set authority higher than yourself' }, { status: 403 });
        }

        // Build update query
        const updates: string[] = [];
        const params: any[] = [];

        if (email !== undefined) { updates.push('email = ?'); params.push(email.toLowerCase()); }
        if (displayName !== undefined) { updates.push('display_name = ?'); params.push(displayName); }
        if (discordId !== undefined) { updates.push('discord_id = ?'); params.push(discordId || null); }
        if (authorityLevel !== undefined) { updates.push('authority_level = ?'); params.push(authorityLevel); }
        if (enabled !== undefined) { updates.push('enabled = ?'); params.push(enabled ? 1 : 0); }
        if (password) {
            const passwordHash = await bcrypt.hash(password, 12);
            updates.push('password_hash = ?');
            params.push(passwordHash);
        }

        if (updates.length === 0) {
            db.close();
            return NextResponse.json({ ok: false, error: 'No updates provided' }, { status: 400 });
        }

        updates.push("updated_at = datetime('now')");
        params.push(userId);

        db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
        db.close();

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Update account error:', error);
        return NextResponse.json({ ok: false, error: 'Failed to update account' }, { status: 500 });
    }
}

// Delete account
export async function DELETE(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        const user = session.user;

        if (!user || !user.userId) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Only Superuser+ can delete accounts
        if ((user.authorityLevel || 0) < 5) {
            return NextResponse.json({ ok: false, error: 'Superuser required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ ok: false, error: 'User ID required' }, { status: 400 });
        }

        if (userId === user.userId) {
            return NextResponse.json({ ok: false, error: 'Cannot delete yourself' }, { status: 400 });
        }

        const db = new Database(AUTH_DB_PATH);

        const target = db.prepare('SELECT authority_level FROM users WHERE id = ?').get(userId) as any;
        if (!target) {
            db.close();
            return NextResponse.json({ ok: false, error: 'User not found' }, { status: 404 });
        }

        // Can't delete users with equal or higher authority
        if (target.authority_level >= (user.authorityLevel || 0)) {
            db.close();
            return NextResponse.json({ ok: false, error: 'Cannot delete user with equal or higher authority' }, { status: 403 });
        }

        db.prepare('DELETE FROM users WHERE id = ?').run(userId);
        db.close();

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Delete account error:', error);
        return NextResponse.json({ ok: false, error: 'Failed to delete account' }, { status: 500 });
    }
}
