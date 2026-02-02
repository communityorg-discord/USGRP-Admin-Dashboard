import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

// Bot API configuration
const BOT_API_URL = 'http://localhost:3320';
const BOT_API_KEY = 'usgrp-admin-2026-secure-key-x7k9m2p4';

// Discord Configuration
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || '';
const GUILD_ID = process.env.DISCORD_GUILD_ID || '1458621643537514590';

// Allowed roles for case reversal
const ALLOWED_ROLES = [
    'Senior Administration',
    'Developer', 
    'President',
    'Chief of Staff',
    'Vice President',
];

export async function POST(
    request: Request,
    { params }: { params: Promise<{ caseId: string }> }
) {
    try {
        // Auth check using iron-session (same as other endpoints)
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        
        if (!session.isLoggedIn || !session.user) {
            return NextResponse.json({ error: 'Unauthorized - Not logged in' }, { status: 401 });
        }

        // Check roles - need Senior Admin+ or specific positions
        const userRoles = session.user.roles || [];
        const hasPermission = ALLOWED_ROLES.some(role => userRoles.includes(role)) || 
                              (session.user.authorityLevel && session.user.authorityLevel >= 4);
        
        if (!hasPermission) {
            return NextResponse.json({ 
                error: 'Insufficient permissions - Senior Admin+ required',
                yourRoles: userRoles,
            }, { status: 403 });
        }

        const { caseId } = await params;
        
        // Get case data from request body (since bot API doesn't have individual case endpoint)
        const body = await request.json().catch(() => ({}));
        const { user_id, action_type } = body;

        if (!user_id || !action_type) {
            return NextResponse.json({ 
                error: 'Missing case data - user_id and action_type required' 
            }, { status: 400 });
        }

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
                const errorText = await unbanResponse.text();
                console.error('Discord unban failed:', errorText);
                return NextResponse.json({ 
                    error: `Failed to unban user on Discord: ${unbanResponse.status}` 
                }, { status: 500 });
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
                const errorText = await unmuteResponse.text();
                console.error('Discord unmute failed:', errorText);
                return NextResponse.json({ 
                    error: `Failed to unmute user on Discord: ${unmuteResponse.status}` 
                }, { status: 500 });
            }
        }

        // Try to update case status via bot API (optional - may not exist)
        await fetch(`${BOT_API_URL}/api/cases/${caseId}/reverse`, {
            method: 'POST',
            headers: { 
                'X-Admin-Key': BOT_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                reversed_by: session.user.discordId || session.user.email,
                reversed_by_name: session.user.displayName || session.user.email,
            }),
        }).catch(() => {}); // Don't fail if bot API doesn't support this

        console.log(`[CASE REVERSE] Case ${caseId} (${action_type}) reversed by ${session.user.displayName} (${session.user.discordId}) for user ${user_id}`);

        return NextResponse.json({ 
            success: true, 
            message: `User has been ${action_type === 'ban' ? 'unbanned' : 'unmuted'} successfully.`
        });
    } catch (error) {
        console.error('Error reversing case:', error);
        return NextResponse.json({ error: 'Failed to reverse case' }, { status: 500 });
    }
}
