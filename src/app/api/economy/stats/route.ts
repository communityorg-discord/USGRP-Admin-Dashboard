import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

const ECONOMY_DB_PATH = '/home/vpcommunityorganisation/CO-Economy-Bot/data/economy.db';

interface EconomyStats {
    totalCitizens: number;
    totalWealth: number;
    avgWealth: number;
    topCitizens: Array<{ username: string; balance: number }>;
    recentTransactions: number;
    treasury: number;
}

export async function GET() {
    let db: Database.Database | null = null;
    
    try {
        db = new Database(ECONOMY_DB_PATH, { readonly: true });
        
        // Total citizens (from citizens table, not users)
        const citizenCount = db.prepare('SELECT COUNT(*) as count FROM citizens').get() as { count: number };
        
        // Total and average wealth (balance + checking + savings)
        const wealthStats = db.prepare(`
            SELECT 
                SUM(balance + checking_balance + savings_balance) as total, 
                AVG(balance + checking_balance + savings_balance) as avg 
            FROM citizens
        `).get() as { total: number; avg: number };
        
        // Top 5 richest citizens
        const topCitizens = db.prepare(`
            SELECT 
                name as username, 
                (balance + checking_balance + savings_balance) as balance 
            FROM citizens 
            ORDER BY (balance + checking_balance + savings_balance) DESC 
            LIMIT 5
        `).all() as Array<{ username: string; balance: number }>;
        
        // Recent transactions (last 24h)
        let recentTransactions = 0;
        try {
            const txResult = db.prepare(`
                SELECT COUNT(*) as count 
                FROM transactions 
                WHERE created_at > datetime('now', '-1 day')
            `).get() as { count: number };
            recentTransactions = txResult?.count || 0;
        } catch {
            // Table might not exist
        }
        
        // Treasury balance (from treasury table)
        let treasury = 0;
        try {
            const treasuryResult = db.prepare(`
                SELECT balance FROM treasury LIMIT 1
            `).get() as { balance: number } | undefined;
            treasury = treasuryResult?.balance || 0;
        } catch {
            // Might not exist
        }
        
        const stats: EconomyStats = {
            totalCitizens: citizenCount.count,
            totalWealth: Math.round(wealthStats.total || 0),
            avgWealth: Math.round(wealthStats.avg || 0),
            topCitizens,
            recentTransactions,
            treasury,
        };
        
        return NextResponse.json(stats);
    } catch (error) {
        console.error('Economy stats error:', error);
        return NextResponse.json({ error: 'Failed to get economy stats' }, { status: 500 });
    } finally {
        if (db) db.close();
    }
}
