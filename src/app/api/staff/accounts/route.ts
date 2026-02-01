import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import Database from 'better-sqlite3';

const AUTH_DB_PATH = '/var/lib/usgrp-auth/auth.db';

export async function GET(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        const user = session.user;

        if (!user || !user.userId) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        const db = new Database(AUTH_DB_PATH, { readonly: true });

        // Get all users from auth system
        const users = db.prepare(`
            SELECT 
                id,
                email,
                discord_id,
                display_name,
                authority_level,
                roles,
                permissions,
                enabled,
                suspended,
                totp_enabled,
                created_at,
                updated_at
            FROM users
            WHERE enabled = 1
            ORDER BY authority_level DESC, display_name ASC
        `).all();

        db.close();

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
