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
        
        if (status) {
            updates.status = status;
            if (status === 'approved' || status === 'denied') {
                updates.reviewed_by = session.user.displayName || session.user.email;
                updates.reviewed_at = new Date().toISOString();
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
        return NextResponse.json({ success: true, appeal: updated });
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
