import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

const DB_PATH = '/home/vpcommunityorganisation/CO-Gov-Utils/data/moderation.db';

interface StaffPerformance {
    moderatorId: string;
    moderatorTag: string;
    totalCases: number;
    warns: number;
    mutes: number;
    kicks: number;
    bans: number;
    last7Days: number;
    last30Days: number;
}

export async function GET() {
    let db: Database.Database | null = null;
    
    try {
        db = new Database(DB_PATH, { readonly: true });
        
        // Get staff performance stats
        const staffStats = db.prepare(`
            SELECT 
                moderator_id,
                moderator_tag,
                COUNT(*) as total_cases,
                SUM(CASE WHEN action_type = 'warn' THEN 1 ELSE 0 END) as warns,
                SUM(CASE WHEN action_type = 'mute' THEN 1 ELSE 0 END) as mutes,
                SUM(CASE WHEN action_type = 'kick' THEN 1 ELSE 0 END) as kicks,
                SUM(CASE WHEN action_type = 'ban' THEN 1 ELSE 0 END) as bans,
                SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as last_7_days,
                SUM(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) as last_30_days
            FROM cases
            WHERE moderator_id IS NOT NULL
            GROUP BY moderator_id
            ORDER BY total_cases DESC
            LIMIT 20
        `).all() as any[];
        
        const performance: StaffPerformance[] = staffStats.map(s => ({
            moderatorId: s.moderator_id,
            moderatorTag: s.moderator_tag || 'Unknown',
            totalCases: s.total_cases,
            warns: s.warns,
            mutes: s.mutes,
            kicks: s.kicks,
            bans: s.bans,
            last7Days: s.last_7_days,
            last30Days: s.last_30_days,
        }));
        
        // Get overall stats
        const overall = db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as week,
                SUM(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) as month,
                SUM(CASE WHEN created_at >= datetime('now', '-1 day') THEN 1 ELSE 0 END) as today
            FROM cases
        `).get() as any;
        
        // Get action breakdown for last 30 days
        const actionBreakdown = db.prepare(`
            SELECT action_type, COUNT(*) as count
            FROM cases
            WHERE created_at >= datetime('now', '-30 days')
            GROUP BY action_type
        `).all() as any[];
        
        // Daily case counts for chart (last 14 days)
        const dailyCases = db.prepare(`
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM cases
            WHERE created_at >= datetime('now', '-14 days')
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `).all() as any[];
        
        return NextResponse.json({
            staff: performance,
            overall: {
                total: overall?.total || 0,
                today: overall?.today || 0,
                week: overall?.week || 0,
                month: overall?.month || 0,
            },
            actionBreakdown: actionBreakdown.reduce((acc, a) => ({ ...acc, [a.action_type]: a.count }), {}),
            dailyCases,
        });
    } catch (error) {
        console.error('Staff performance error:', error);
        return NextResponse.json({ error: 'Failed to get staff performance' }, { status: 500 });
    } finally {
        if (db) db.close();
    }
}
