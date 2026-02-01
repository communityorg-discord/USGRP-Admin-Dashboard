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

        if ((user.authorityLevel || 0) < 3) {
            return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
        const offset = parseInt(searchParams.get('offset') || '0');
        const userId = searchParams.get('userId');
        const action = searchParams.get('action');
        const search = searchParams.get('search');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const severity = searchParams.get('severity'); // 'all' | 'warning' | 'critical'

        const db = new Database(AUTH_DB_PATH, { readonly: true });

        // Build dynamic WHERE clause
        const conditions: string[] = [];
        const params: any[] = [];

        if (userId) {
            conditions.push('a.user_id = ?');
            params.push(userId);
        }
        if (action) {
            conditions.push('a.action = ?');
            params.push(action);
        }
        if (search) {
            conditions.push('(u.display_name LIKE ? OR u.email LIKE ? OR a.target LIKE ? OR a.ip LIKE ?)');
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }
        if (startDate) {
            conditions.push('a.created_at >= ?');
            params.push(startDate);
        }
        if (endDate) {
            conditions.push('a.created_at <= ?');
            params.push(endDate + ' 23:59:59');
        }
        if (severity === 'warning') {
            conditions.push("a.action IN ('LOGIN_FAILED', 'MFA_DISABLED', 'ACCOUNT_LOCKED')");
        } else if (severity === 'critical') {
            conditions.push("a.action IN ('USER_DELETED', 'ACCOUNT_LOCKED', 'PASSWORD_RESET_FORCED')");
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Get audit log entries with user info
        const logs = db.prepare(`
            SELECT 
                a.id, a.user_id, a.action, a.target, a.target_user, a.details, a.ip, a.created_at,
                u.display_name, u.email
            FROM audit_log a
            LEFT JOIN users u ON a.user_id = u.id
            ${whereClause}
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?
        `).all(...params, limit, offset) as any[];

        // Get total count
        const countResult = db.prepare(`SELECT COUNT(*) as count FROM audit_log a LEFT JOIN users u ON a.user_id = u.id ${whereClause}`).get(...params) as any;

        // Get action type stats (all time)
        const actionStats = db.prepare(`
            SELECT action, COUNT(*) as count 
            FROM audit_log 
            GROUP BY action 
            ORDER BY count DESC
        `).all() as any[];

        // Get action type stats (7 days)
        const recentActionStats = db.prepare(`
            SELECT action, COUNT(*) as count 
            FROM audit_log 
            WHERE created_at >= datetime('now', '-7 days')
            GROUP BY action 
            ORDER BY count DESC
        `).all() as any[];

        // Get active sessions with more detail
        const activeSessions = db.prepare(`
            SELECT 
                s.id, s.user_id, s.device_name, s.ip, s.user_agent, s.last_active, s.created_at,
                s.is_remembered, s.device_fingerprint,
                u.display_name, u.email, u.authority_level
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.expires_at > datetime('now')
            ORDER BY s.last_active DESC
        `).all() as any[];

        // Get login stats for last 14 days
        const loginStats = db.prepare(`
            SELECT 
                date(created_at) as date,
                SUM(CASE WHEN action = 'LOGIN_SUCCESS' THEN 1 ELSE 0 END) as success,
                SUM(CASE WHEN action = 'LOGIN_FAILED' THEN 1 ELSE 0 END) as failed,
                SUM(CASE WHEN action = 'SSO_ACCESS' THEN 1 ELSE 0 END) as sso
            FROM audit_log
            WHERE action IN ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'SSO_ACCESS')
            AND created_at >= datetime('now', '-14 days')
            GROUP BY date(created_at)
            ORDER BY date DESC
        `).all() as any[];

        // Get user activity summary (top 15)
        const userActivity = db.prepare(`
            SELECT 
                a.user_id, u.display_name, u.email, u.authority_level,
                COUNT(*) as action_count,
                MAX(a.created_at) as last_action,
                SUM(CASE WHEN a.action = 'LOGIN_FAILED' THEN 1 ELSE 0 END) as failed_logins
            FROM audit_log a
            JOIN users u ON a.user_id = u.id
            WHERE a.created_at >= datetime('now', '-7 days')
            GROUP BY a.user_id
            ORDER BY action_count DESC
            LIMIT 15
        `).all() as any[];

        // Get unique IPs per user (last 7 days)
        const userIps = db.prepare(`
            SELECT user_id, COUNT(DISTINCT ip) as unique_ips
            FROM audit_log
            WHERE created_at >= datetime('now', '-7 days')
            AND ip IS NOT NULL AND ip != ''
            GROUP BY user_id
        `).all() as any[];
        const ipMap = new Map(userIps.map((u: any) => [u.user_id, u.unique_ips]));

        // Security alerts - suspicious activity
        const securityAlerts = db.prepare(`
            SELECT 
                a.user_id, u.display_name, u.email, a.action, a.ip, a.created_at, a.details,
                (SELECT COUNT(*) FROM audit_log WHERE user_id = a.user_id AND action = 'LOGIN_FAILED' AND created_at >= datetime('now', '-1 hour')) as recent_failures
            FROM audit_log a
            JOIN users u ON a.user_id = u.id
            WHERE (
                (a.action = 'LOGIN_FAILED' AND a.created_at >= datetime('now', '-1 hour'))
                OR a.action IN ('ACCOUNT_LOCKED', 'MFA_DISABLED', 'PASSWORD_RESET_FORCED')
            )
            AND a.created_at >= datetime('now', '-24 hours')
            ORDER BY a.created_at DESC
            LIMIT 20
        `).all() as any[];

        // Hourly activity (last 24 hours)
        const hourlyActivity = db.prepare(`
            SELECT 
                strftime('%H', created_at) as hour,
                COUNT(*) as count
            FROM audit_log
            WHERE created_at >= datetime('now', '-24 hours')
            GROUP BY hour
            ORDER BY hour
        `).all() as any[];

        // Get all unique actions for filter dropdown
        const allActions = db.prepare(`SELECT DISTINCT action FROM audit_log ORDER BY action`).all() as any[];

        // Recent IP addresses with locations (we'll parse later)
        const recentIps = db.prepare(`
            SELECT DISTINCT ip, MAX(created_at) as last_seen, COUNT(*) as times_seen
            FROM audit_log
            WHERE ip IS NOT NULL AND ip != '' AND created_at >= datetime('now', '-7 days')
            GROUP BY ip
            ORDER BY last_seen DESC
            LIMIT 50
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
                recentActionTypes: recentActionStats,
                loginsByDay: loginStats,
                hourlyActivity,
                activeSessionCount: activeSessions.length,
                totalEvents: countResult?.count || 0,
            },
            activeSessions: activeSessions.map(s => ({
                id: s.id,
                userId: s.user_id,
                displayName: s.display_name,
                email: s.email,
                authorityLevel: s.authority_level,
                deviceName: s.device_name,
                deviceFingerprint: s.device_fingerprint,
                ip: s.ip,
                userAgent: s.user_agent,
                lastActive: s.last_active,
                createdAt: s.created_at,
                isRemembered: !!s.is_remembered,
            })),
            userActivity: userActivity.map(u => ({
                userId: u.user_id,
                displayName: u.display_name,
                email: u.email,
                authorityLevel: u.authority_level,
                actionCount: u.action_count,
                lastAction: u.last_action,
                failedLogins: u.failed_logins,
                uniqueIps: ipMap.get(u.user_id) || 0,
            })),
            securityAlerts: securityAlerts.map(a => ({
                userId: a.user_id,
                displayName: a.display_name,
                email: a.email,
                action: a.action,
                ip: a.ip,
                createdAt: a.created_at,
                details: a.details,
                recentFailures: a.recent_failures,
            })),
            allActions: allActions.map(a => a.action),
            recentIps,
        });
    } catch (error) {
        console.error('Activity fetch error:', error);
        return NextResponse.json({ ok: false, error: 'Failed to fetch activity' }, { status: 500 });
    }
}

// Terminate a session
export async function DELETE(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        const user = session.user;

        if (!user || !user.userId) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        if ((user.authorityLevel || 0) < 4) { // Senior Admin+ required
            return NextResponse.json({ ok: false, error: 'Senior Admin required' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');

        if (!sessionId) {
            return NextResponse.json({ ok: false, error: 'Session ID required' }, { status: 400 });
        }

        const db = new Database(AUTH_DB_PATH);

        // Get session info for logging
        const targetSession = db.prepare('SELECT user_id FROM sessions WHERE id = ?').get(sessionId) as any;
        
        if (!targetSession) {
            db.close();
            return NextResponse.json({ ok: false, error: 'Session not found' }, { status: 404 });
        }

        // Delete the session
        db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);

        // Log the action
        db.prepare(`
            INSERT INTO audit_log (user_id, action, target, details, ip, target_user)
            VALUES (?, 'SESSION_TERMINATED', ?, 'Session forcefully terminated by admin', ?, ?)
        `).run(user.userId, sessionId, request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown', targetSession.user_id);

        db.close();

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Session terminate error:', error);
        return NextResponse.json({ ok: false, error: 'Failed to terminate session' }, { status: 500 });
    }
}
