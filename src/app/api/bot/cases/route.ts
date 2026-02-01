import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

// Bot API configuration
const BOT_API_URL = 'http://localhost:3320';
const BOT_API_KEY = 'usgrp-admin-2026-secure-key-x7k9m2p4';

// Discord Configuration (from environment)
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || '';
const GUILD_ID = process.env.DISCORD_GUILD_ID || '1458621643537514590';

export async function GET() {
    try {
        const response = await fetch(`${BOT_API_URL}/api/cases?limit=10`, {
            headers: { 'X-Admin-Key': BOT_API_KEY },
            cache: 'no-store'
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Bot API error' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Bot API connection failed:', error);
        return NextResponse.json({ error: 'Bot API not available' }, { status: 503 });
    }
}

// Superusers map for manual overrides if needed
const SUPERUSER_MAP: Record<string, string> = {
    'evans@usgrp.xyz': 'Evan S.',
    'dionm@usgrp.xyz': 'Dion M.'
};

export async function POST(req: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        const body = await req.json();
        const { userId, actionType, reason, duration, evidence } = body;

        // Determine moderator tag
        let moderatorTag = 'Admin Panel';
        const userEmail = session.user?.email || session.email;
        const userDisplay = session.user?.displayName;

        if (userEmail && SUPERUSER_MAP[userEmail.toLowerCase()]) {
            moderatorTag = SUPERUSER_MAP[userEmail.toLowerCase()];
        } else if (userDisplay) {
            moderatorTag = userDisplay;
        } else if (userEmail) {
            moderatorTag = userEmail;
        }

        // Add moderator tag to body
        const payload = {
            ...body,
            moderator_tag: moderatorTag
        };

        if (!userId || !actionType || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Try to DM the user (MUST be done before Kick/Ban)
        try {
            console.log(`[AdminAPI] Attempting to DM user ${userId} for action ${actionType}`);
            // Create DM channel
            const dmRes = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bot ${DISCORD_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ recipient_id: userId })
            });
            
            if (dmRes.ok) {
                const dmChannel = await dmRes.json();
                console.log(`[AdminAPI] DM channel created: ${dmChannel.id}`);
                // Send message
                const msgRes = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bot ${DISCORD_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        embeds: [{
                            title: `Moderation Action: ${actionType.toUpperCase()}`,
                            description: `You have received a moderation action in USGRP.\n\n**Reason:** ${reason}\n${duration ? `**Duration:** ${duration}` : ''}`,
                            color: actionType === 'ban' ? 0xFF0000 : 0xFFA500,
                            timestamp: new Date().toISOString()
                        }]
                    })
                });
                
                if (!msgRes.ok) {
                    console.error('Failed to send DM:', await msgRes.text());
                } else {
                    console.log('[AdminAPI] DM sent successfully');
                }
            } else {
                console.error('Failed to open DM channel:', await dmRes.text());
            }
        } catch (dmError) {
            console.error('DM execution error:', dmError);
        }

        // Wait 500ms to ensure DM delivery before action (especially for bans)
        await new Promise(resolve => setTimeout(resolve, 500));

        // 2. Perform Discord Action
        try {
            if (actionType === 'kick') {
                await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bot ${DISCORD_TOKEN}`,
                        'X-Audit-Log-Reason': reason
                    }
                });
            } else if (actionType === 'ban') {
                await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/bans/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bot ${DISCORD_TOKEN}`,
                        'Content-Type': 'application/json',
                        'X-Audit-Log-Reason': reason
                    },
                    body: JSON.stringify({ delete_message_seconds: 0 })
                });
            } else if (actionType === 'mute') {
                // Parse duration (e.g. "1h", "1d") or default to 1 hour
                let minutes = 60;
                if (duration) {
                    const match = duration.match(/(\d+)([mhd])/);
                    if (match) {
                        const val = parseInt(match[1]);
                        const unit = match[2];
                        if (unit === 'm') minutes = val;
                        if (unit === 'h') minutes = val * 60;
                        if (unit === 'd') minutes = val * 60 * 24;
                    }
                }
                
                const timeoutUntil = new Date(Date.now() + minutes * 60000).toISOString();
                
                await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bot ${DISCORD_TOKEN}`,
                        'Content-Type': 'application/json',
                        'X-Audit-Log-Reason': reason
                    },
                    body: JSON.stringify({ communication_disabled_until: timeoutUntil })
                });
            }

        } catch (discordError) {
            console.error('Discord API Error:', discordError);
            // We continue to log to DB even if Discord fails (or maybe we should error? keeping it safe)
        }

        // 3. Log to DB via Citizen API
        const dbResponse = await fetch(`${BOT_API_URL}/api/cases`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Admin-Key': BOT_API_KEY 
            },
            body: JSON.stringify(payload)
        });

        if (!dbResponse.ok) {
            return NextResponse.json({ error: 'Failed to save case to DB' }, { status: dbResponse.status });
        }

        const data = await dbResponse.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Create case error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
