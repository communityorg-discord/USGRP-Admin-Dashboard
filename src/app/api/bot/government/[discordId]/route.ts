import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import Database from 'better-sqlite3';

const ECONOMY_DB_PATH = '/home/vpcommunityorganisation/CO-Economy-Bot/data/economy.db';
const GUILD_ID = '1458621643537514590';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ discordId: string }> }
) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        const user = session.user;

        if (!user || !user.userId) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { discordId } = await params;

        if (!discordId) {
            return NextResponse.json({ ok: false, error: 'Discord ID required' }, { status: 400 });
        }

        const db = new Database(ECONOMY_DB_PATH, { readonly: true });

        // Get government member info
        const member = db.prepare(`
            SELECT * FROM government_members 
            WHERE user_id = ? AND guild_id = ?
        `).get(discordId, GUILD_ID) as any;

        // Get citizen info
        const citizen = db.prepare(`
            SELECT * FROM citizens 
            WHERE user_id = ? AND guild_id = ?
        `).get(discordId, GUILD_ID) as any;

        // Get position history
        const positions = db.prepare(`
            SELECT gp.* FROM government_positions gp
            JOIN government_members gm ON gp.gov_member_id = gm.id
            WHERE gm.user_id = ? AND gm.guild_id = ?
            ORDER BY gp.assigned_at DESC
            LIMIT 10
        `).all(discordId, GUILD_ID) as any[];

        db.close();

        if (!citizen && !member) {
            return NextResponse.json({ ok: false, error: 'Official not found' }, { status: 404 });
        }

        // Parse housing JSON if exists
        let housing = null;
        if (citizen?.housing) {
            try { housing = JSON.parse(citizen.housing); } catch (e) {}
        }

        return NextResponse.json({
            ok: true,
            member: member ? {
                id: member.id,
                govId: member.gov_id,
                position: member.current_position,
                positionKey: member.current_position_key,
                termStart: member.term_start,
                termEnd: member.term_end,
                status: member.status,
                registeredAt: member.registered_at,
            } : null,
            citizen: citizen ? {
                citizenId: citizen.citizen_id,
                name: citizen.name,
                age: citizen.age,
                state: citizen.state,
                education: citizen.education,
                employment: citizen.employment,
                employer: citizen.employer,
                salary: citizen.salary || 0,
                balance: citizen.balance || 0,
                checkingBalance: citizen.checking_balance || 0,
                savingsBalance: citizen.savings_balance || 0,
                creditScore: citizen.credit_score || 650,
                netWorth: citizen.net_worth || 0,
                criminalRecord: citizen.criminal_record || 0,
                arrests: citizen.arrests || 0,
                taxesPaid: citizen.taxes_paid || 0,
                taxesOwed: citizen.taxes_owed || 0,
                canVote: !!citizen.can_vote,
                status: citizen.status,
                housing,
                createdAt: citizen.created_at,
                updatedAt: citizen.updated_at,
            } : null,
            positionHistory: positions.map(p => ({
                id: p.id,
                position: p.position,
                positionKey: p.position_key,
                assignedAt: p.assigned_at,
                assignedBy: p.assigned_by,
                endedAt: p.ended_at,
            })),
        });
    } catch (error) {
        console.error('Government official fetch error:', error);
        return NextResponse.json({ ok: false, error: 'Failed to fetch official' }, { status: 500 });
    }
}
