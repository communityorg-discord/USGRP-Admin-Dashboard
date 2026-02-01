import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import Database from 'better-sqlite3';

const ECONOMY_DB_PATH = '/home/vpcommunityorganisation/CO-Economy-Bot/data/economy.db';

export async function GET(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        const user = session.user;

        if (!user || !user.userId) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        const db = new Database(ECONOMY_DB_PATH, { readonly: true });

        // Get all active government members with their positions
        const members = db.prepare(`
            SELECT 
                gm.id,
                gm.gov_id,
                gm.user_id,
                gm.guild_id,
                gm.current_position,
                gm.current_position_key,
                gm.term_start,
                gm.term_end,
                gm.status,
                gm.registered_at,
                c.name as display_name,
                c.citizen_id
            FROM government_members gm
            LEFT JOIN citizens c ON gm.user_id = c.user_id AND gm.guild_id = c.guild_id
            WHERE gm.status = 'active'
            ORDER BY 
                CASE 
                    WHEN gm.current_position_key = 'president' THEN 1
                    WHEN gm.current_position_key = 'vicePresident' THEN 2
                    WHEN gm.current_position_key = 'whiteHouseChiefOfStaff' THEN 3
                    WHEN gm.current_position_key LIKE 'secretaryOf%' THEN 4
                    ELSE 5
                END,
                gm.registered_at ASC
        `).all();

        db.close();

        // Categorize members
        const executive = members.filter((m: any) => 
            ['president', 'vicePresident', 'whiteHouseChiefOfStaff'].includes(m.current_position_key) ||
            m.current_position_key?.startsWith('wh')
        );
        const cabinet = members.filter((m: any) => 
            m.current_position_key?.startsWith('secretaryOf')
        );
        const other = members.filter((m: any) => 
            !executive.includes(m) && !cabinet.includes(m)
        );

        return NextResponse.json({
            ok: true,
            officials: members.map((m: any) => ({
                id: m.id,
                govId: m.gov_id,
                discordId: m.user_id,
                displayName: m.display_name || 'Unknown',
                citizenId: m.citizen_id,
                position: m.current_position,
                positionKey: m.current_position_key,
                status: m.status,
                registeredAt: m.registered_at,
                termStart: m.term_start,
                termEnd: m.term_end,
            })),
            stats: {
                total: members.length,
                executive: executive.length,
                cabinet: cabinet.length,
                other: other.length,
            },
            lastUpdated: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Government fetch error:', error);
        return NextResponse.json({ ok: false, error: 'Failed to fetch government data' }, { status: 500 });
    }
}
