import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { 
    getAppealById, 
    updateAppeal, 
    addAppealMessage, 
    getAppealMessages,
    getAppealHistory,
    logHistory
} from '@/lib/appeals-db';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// Discord Configuration
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || '';
const GUILD_ID = process.env.DISCORD_GUILD_ID || '1458621643537514590';

// Reverse a punishment on Discord
async function reversePunishment(userId: string, actionType: string): Promise<{ success: boolean; message: string }> {
    if (!DISCORD_TOKEN) {
        return { success: false, message: 'Discord token not configured' };
    }

    try {
        if (actionType === 'ban') {
            const response = await fetch(
                `https://discord.com/api/v10/guilds/${GUILD_ID}/bans/${userId}`,
                {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bot ${DISCORD_TOKEN}` },
                }
            );
            if (response.ok || response.status === 404) {
                return { success: true, message: 'User unbanned' };
            }
            return { success: false, message: `Unban failed: ${response.status}` };
        } else if (actionType === 'mute') {
            const response = await fetch(
                `https://discord.com/api/v10/guilds/${GUILD_ID}/members/${userId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bot ${DISCORD_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ communication_disabled_until: null }),
                }
            );
            if (response.ok) {
                return { success: true, message: 'User unmuted' };
            }
            return { success: false, message: `Unmute failed: ${response.status}` };
        }
        return { success: false, message: `Cannot reverse ${actionType} actions` };
    } catch (error) {
        console.error('Reverse punishment error:', error);
        return { success: false, message: 'Discord API error' };
    }
}

// Send DM to user
async function sendDMToUser(userId: string, message: string): Promise<boolean> {
    if (!DISCORD_TOKEN) return false;
    
    try {
        // Create DM channel
        const channelRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${DISCORD_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ recipient_id: userId }),
        });
        
        if (!channelRes.ok) return false;
        const channel = await channelRes.json();
        
        // Send message
        const msgRes = await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bot ${DISCORD_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: message }),
        });
        
        return msgRes.ok;
    } catch {
        return false;
    }
}

// GET - Get single appeal with messages and history
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        
        // Check auth for full details, allow limited public access for status check
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        const isAdmin = session.isLoggedIn && session.user;

        const appeal = getAppealById(id);
        if (!appeal) {
            return NextResponse.json({ error: 'Appeal not found' }, { status: 404 });
        }

        // If not admin, return limited info (for public status check)
        if (!isAdmin) {
            return NextResponse.json({
                id: appeal.id,
                status: appeal.status,
                created_at: appeal.created_at,
                updated_at: appeal.updated_at,
            });
        }

        // Full details for admins
        const messages = getAppealMessages(id, true);
        const history = getAppealHistory(id);

        return NextResponse.json({ appeal, messages, history });
    } catch (error: unknown) {
        console.error('Get appeal error:', error);
        return NextResponse.json({ error: 'Failed to get appeal' }, { status: 500 });
    }
}

// PUT - Update appeal (admin only)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Check auth
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.isLoggedIn || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const appeal = getAppealById(id);
        if (!appeal) {
            return NextResponse.json({ error: 'Appeal not found' }, { status: 404 });
        }

        const body = await request.json();
        const { status, priority, assigned_to, review_note, internal_notes, message, is_internal } = body;

        const updates: any = {};
        let reversalResult: { success: boolean; message: string } | null = null;
        
        if (status) {
            updates.status = status;
            if (status === 'approved' || status === 'denied') {
                updates.reviewed_by = session.user.displayName || session.user.email;
                updates.reviewed_at = new Date().toISOString();
            }
            
            // AUTO-REVERSE: If approved, reverse the punishment
            if (status === 'approved' && appeal.discord_id && appeal.appeal_type) {
                const actionType = appeal.appeal_type; // 'ban', 'mute', 'warn'
                
                if (actionType === 'ban' || actionType === 'mute') {
                    reversalResult = await reversePunishment(appeal.discord_id, actionType);
                    
                    if (reversalResult.success) {
                        // Log the reversal
                        logHistory(id, 'PUNISHMENT_REVERSED', actionType, 'reversed', 
                            session.user.displayName || session.user.email);
                        
                        // Send DM to user
                        const dmMessage = actionType === 'ban'
                            ? `🎉 **Your ban appeal has been approved!**\n\nYou have been unbanned from USGRP. You may now rejoin the server.\n\nPlease review our rules before rejoining: https://discord.gg/usgrp`
                            : `🎉 **Your mute appeal has been approved!**\n\nYour timeout has been removed. You may now chat in the server again.\n\nPlease follow the rules to avoid future moderation actions.`;
                        
                        await sendDMToUser(appeal.discord_id, dmMessage);
                    }
                } else if (actionType === 'warn') {
                    // Warnings can't be "reversed" on Discord, just acknowledged
                    reversalResult = { 
                        success: true, 
                        message: 'Warning appeal noted. Warnings cannot be removed from Discord automatically.' 
                    };
                }
            }
            
            // AUTO-DM: If denied, notify user
            if (status === 'denied' && appeal.discord_id) {
                const dmMessage = `❌ **Your ${appeal.appeal_type} appeal has been denied.**\n\n${review_note ? `Reason: ${review_note}\n\n` : ''}If you believe this is a mistake, you may submit a new appeal after 30 days.`;
                await sendDMToUser(appeal.discord_id, dmMessage);
            }
        }
        if (priority) updates.priority = priority;
        if (assigned_to !== undefined) updates.assigned_to = assigned_to;
        if (review_note !== undefined) updates.review_note = review_note;
        if (internal_notes !== undefined) updates.internal_notes = internal_notes;

        const performedBy = session.user.displayName || session.user.email;

        if (Object.keys(updates).length > 0) {
            const success = updateAppeal(id, updates, performedBy);
            if (!success) {
                return NextResponse.json({ error: 'Failed to update appeal' }, { status: 500 });
            }
        }

        // Add message if provided
        if (message) {
            addAppealMessage({
                appeal_id: id,
                sender_type: 'staff',
                sender_id: session.user.userId,
                sender_name: performedBy,
                message,
                is_internal: is_internal || false,
            });
        }

        const updated = getAppealById(id);
        return NextResponse.json({ 
            success: true, 
            appeal: updated,
            reversal: reversalResult,
        });
    } catch (error: unknown) {
        console.error('Update appeal error:', error);
        return NextResponse.json({ error: 'Failed to update appeal' }, { status: 500 });
    }
}

// DELETE - Delete appeal (admin only, soft delete by setting status)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Check auth - require higher authority for deletion
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.isLoggedIn || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if ((session.user.authorityLevel || 0) < 4) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        }

        const appeal = getAppealById(id);
        if (!appeal) {
            return NextResponse.json({ error: 'Appeal not found' }, { status: 404 });
        }

        const performedBy = session.user.displayName || session.user.email;
        logHistory(id, 'DELETED', appeal.status, 'deleted', performedBy);

        // Actually we should keep records - just mark as deleted/archived
        // For now, we won't actually delete, just deny with note
        updateAppeal(id, { 
            status: 'denied' as any, 
            internal_notes: `Deleted by ${performedBy} at ${new Date().toISOString()}` 
        }, performedBy);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Delete appeal error:', error);
        return NextResponse.json({ error: 'Failed to delete appeal' }, { status: 500 });
    }
}
