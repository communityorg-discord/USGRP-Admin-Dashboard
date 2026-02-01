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

        // Only Admin+ can view activity
        if ((user.authorityLevel || 0) < 3) {
            return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
        const offset = parseInt(searchParams.get('offset') || '0');
        const userId = searchParams.get('userId');
        const action = searchParams.get('action');

        const db = new Database(AUTH_DB_PATH, { readonly: true });

        // Build query with filters
        let whereClause = '';
        const params: any[] = [];

        if (userId) {
            whereClause = 'WHERE a.user_id = ?';
            params.push(userId);
        }
        if (action) {
            whereClause = whereClause ? `${whereClause} AND a.action = ?` : 'WHERE a.action = ?';
            params.push(action);
        }

        // Get audit log entries with user info
        const logs = db.prepare(`
            SELECT 
                a.id,
                a.user_id,
                a.action,
                a.target,
                a.target_user,
                a.details,
                a.ip,
                a.created_at,
                u.display_name,
                u.email
            FROM audit_log a
            LEFT JOIN users u ON a.user_id = u.id
            ${whereClause}
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?
        `).all(...params, limit, offset) as any[];

        // Get total count
        const countResult = db.prepare(`
            SELECT COUNT(*) as count FROM audit_log a ${whereClause}
        `).get(...params) as any;

        // Get action type stats
        const actionStats = db.prepare(`
            SELECT action, COUNT(*) as count 
            FROM audit_log 
            WHERE created_at >= datetime('now', '-7 days')
            GROUP BY action 
            ORDER BY count DESC
        `).all() as any[];

        // Get active sessions
        const activeSessions = db.prepare(`
            SELECT 
                s.id,
                s.user_id,
                s.device_name,
                s.ip,
                s.user_agent,
                s.last_active,
                s.created_at,
                u.display_name,
                u.email
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.expires_at > datetime('now')
            ORDER BY s.last_active DESC
            LIMIT 50
        `).all() as any[];

        // Get login stats for last 7 days
        const loginStats = db.prepare(`
            SELECT 
                date(created_at) as date,
                COUNT(*) as count
            FROM audit_log
            WHERE action IN ('LOGIN_SUCCESS', 'SSO_ACCESS')
            AND created_at >= datetime('now', '-7 days')
            GROUP BY date(created_at)
            ORDER BY date DESC
        `).all() as any[];

        // Get user activity summary
        const userActivity = db.prepare(`
            SELECT 
                a.user_id,
                u.display_name,
                u.email,
                COUNT(*) as action_count,
                MAX(a.created_at) as last_action
            FROM audit_log a
            JOIN users u ON a.user_id = u.id
            WHERE a.created_at >= datetime('now', '-7 days')
            GROUP BY a.user_id
            ORDER BY action_count DESC
            LIMIT 10
        `).all() as any[];

        db.close();

        return NextResponse.json({
            ok: true,
            logs: logs.map(log => ({
                id: log.id,
                userId: log.user_id,
                displayName: log.display_name || 'Unknown',
                email: log.email,
                action: log.action,
                target: log.target,
                targetUser: log.target_user,
                details: log.details,
                ip: log.ip,
                createdAt: log.created_at,
            })),
            pagination: {
                total: countResult?.count || 0,
                limit,
                offset,
                hasMore: offset + logs.length < (countResult?.count || 0),
            },
            stats: {
                actionTypes: actionStats,
                loginsByDay: loginStats,
                activeSessionCount: activeSessions.length,
            },
            activeSessions: activeSessions.map(s => ({
                id: s.id,
                userId: s.user_id,
                displayName: s.display_name,
                email: s.email,
                deviceName: s.device_name,
                ip: s.ip,
                userAgent: s.user_agent,
                lastActive: s.last_active,
                createdAt: s.created_at,
            })),
            userActivity: userActivity.map(u => ({
                userId: u.user_id,
                displayName: u.display_name,
                email: u.email,
                actionCount: u.action_count,
                lastAction: u.last_action,
            })),
        });
    } catch (error) {
        console.error('Activity fetch error:', error);
        return NextResponse.json({ ok: false, error: 'Failed to fetch activity' }, { status: 500 });
    }
}
