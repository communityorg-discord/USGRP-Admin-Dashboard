import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

const DB_PATH = '/home/vpcommunityorganisation/CO-Gov-Utils/data/moderation.db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    
    if (!query || query.length < 2) {
        return NextResponse.json({ results: [] });
    }
    
    let db: Database.Database | null = null;
    
    try {
        db = new Database(DB_PATH, { readonly: true });
        
        // Search by user ID or tag
        const isNumeric = /^\d+$/.test(query);
        
        let results;
        if (isNumeric) {
            // Search by user ID
            results = db.prepare(`
                SELECT DISTINCT 
                    user_id,
                    user_tag,
                    COUNT(*) as case_count,
                    MAX(created_at) as last_case
                FROM cases
                WHERE user_id LIKE ?
                GROUP BY user_id
                ORDER BY case_count DESC
                LIMIT 10
            `).all(`%${query}%`);
        } else {
            // Search by username/tag
            results = db.prepare(`
                SELECT DISTINCT 
                    user_id,
                    user_tag,
                    COUNT(*) as case_count,
                    MAX(created_at) as last_case
                FROM cases
                WHERE user_tag LIKE ?
                GROUP BY user_id
                ORDER BY case_count DESC
                LIMIT 10
            `).all(`%${query}%`);
        }
        
        return NextResponse.json({ results });
    } catch (error) {
        console.error('User search error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    } finally {
        if (db) db.close();
    }
}
