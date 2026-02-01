import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Bot API configuration
const BOT_API_URL = 'http://localhost:3320';
const BOT_API_KEY = 'usgrp-admin-2026-secure-key-x7k9m2p4';

// Discord Configuration
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || '';
const GUILD_ID = process.env.DISCORD_GUILD_ID || '1458621643537514590';

async function validateSession() {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin_session')?.value;
    if (!sessionToken) return null;
    
    try {
        const res = await fetch(`${process.env.AUTH_URL || 'https://auth.usgrp.xyz'}/api/session`, {
            headers: { 'Authorization': `Bearer ${sessionToken}` },
            cache: 'no-store',
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ caseId: string }> }
) {
    const session = await validateSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Senior Admin+ can reverse cases
    const allowedRoles = ['Senior Administration', 'Developer', 'President'];
    if (!session.roles?.some((r: string) => allowedRoles.includes(r))) {
        return NextResponse.json({ error: 'Insufficient permissions - Senior Admin+ required' }, { status: 403 });
    }

    const { caseId } = await params;

    try {
        // Get the case first
        const caseResponse = await fetch(`${BOT_API_URL}/api/cases/${caseId}`, {
            headers: { 'X-Admin-Key': BOT_API_KEY },
            cache: 'no-store'
        });

        if (!caseResponse.ok) {
            return NextResponse.json({ error: 'Case not found' }, { status: 404 });
        }

        const caseData = await caseResponse.json();
        const { user_id, action_type } = caseData;

        // Only ban and mute can be reversed
        if (!['ban', 'mute'].includes(action_type)) {
            return NextResponse.json({ 
                error: `Cannot reverse ${action_type} actions. Only bans and mutes can be reversed.` 
            }, { status: 400 });
        }

        // Call Discord API to reverse the action
        if (action_type === 'ban') {
            // Unban the user
            const unbanResponse = await fetch(
                `https://discord.com/api/v10/guilds/${GUILD_ID}/bans/${user_id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bot ${DISCORD_TOKEN}`,
                    },
                }
            );

            if (!unbanResponse.ok && unbanResponse.status !== 404) {
                console.error('Discord unban failed:', await unbanResponse.text());
                return NextResponse.json({ error: 'Failed to unban user on Discord' }, { status: 500 });
            }
        } else if (action_type === 'mute') {
            // Remove timeout from user
            const unmuteResponse = await fetch(
                `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${user_id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bot ${DISCORD_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ communication_disabled_until: null }),
                }
            );

            if (!unmuteResponse.ok) {
                console.error('Discord unmute failed:', await unmuteResponse.text());
                return NextResponse.json({ error: 'Failed to unmute user on Discord' }, { status: 500 });
            }
        }

        // Update case status via bot API
        await fetch(`${BOT_API_URL}/api/cases/${caseId}/reverse`, {
            method: 'POST',
            headers: { 
                'X-Admin-Key': BOT_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                reversed_by: session.discordId,
                reversed_by_name: session.username,
            }),
        }).catch(() => {}); // Don't fail if bot API doesn't support this

        console.log(`[CASE REVERSE] Case ${caseId} (${action_type}) reversed by ${session.username} (${session.discordId}) for user ${user_id}`);

        return NextResponse.json({ 
            success: true, 
            message: `User has been ${action_type === 'ban' ? 'unbanned' : 'unmuted'} successfully.`
        });
    } catch (error) {
        console.error('Error reversing case:', error);
        return NextResponse.json({ error: 'Failed to reverse case' }, { status: 500 });
    }
}
