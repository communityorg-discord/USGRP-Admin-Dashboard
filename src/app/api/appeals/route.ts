import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { 
    createAppeal, 
    listAppeals, 
    getAppealStats, 
    getPendingAppealByDiscordId,
    addAppealMessage 
} from '@/lib/appeals-db';

// POST - Create new appeal (public, no auth required)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { discordId, discordUsername, email, appealType, banReason, appealMessage, evidence } = body;

        if (!discordId || !email || !appealMessage) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate Discord ID format
        if (!/^\d{17,19}$/.test(discordId)) {
            return NextResponse.json({ error: 'Invalid Discord ID format' }, { status: 400 });
        }

        // Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        // Check for existing pending appeal
        const existing = getPendingAppealByDiscordId(discordId);
        if (existing) {
            return NextResponse.json({
                error: 'You already have a pending appeal',
                appealId: existing.id
            }, { status: 400 });
        }

        // Get IP for tracking
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') || 'unknown';

        const appeal = createAppeal({
            discord_id: discordId,
            discord_username: discordUsername,
            email,
            appeal_type: appealType || 'ban',
            ban_reason: banReason,
            appeal_message: appealMessage,
            evidence,
            ip_address: ip,
        });

        if (!appeal) {
            return NextResponse.json({ error: 'Failed to create appeal' }, { status: 500 });
        }

        // Add initial message
        addAppealMessage({
            appeal_id: appeal.id,
            sender_type: 'user',
            sender_name: discordUsername || discordId,
            message: appealMessage,
        });

        return NextResponse.json({ 
            success: true, 
            appealId: appeal.id,
            message: 'Your appeal has been submitted successfully.'
        });
    } catch (error: unknown) {
        console.error('Appeal submission error:', error);
        return NextResponse.json({ error: 'Failed to submit appeal' }, { status: 500 });
    }
}

// GET - List appeals (admin only)
export async function GET(request: NextRequest) {
    try {
        // Check auth
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.isLoggedIn || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || undefined;
        const priority = searchParams.get('priority') || undefined;
        const assignedTo = searchParams.get('assignedTo') || undefined;
        const search = searchParams.get('search') || undefined;
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const { appeals, total } = listAppeals({ status, priority, assignedTo, search, limit, offset });
        const stats = getAppealStats();

        return NextResponse.json({ appeals, total, stats });
    } catch (error: unknown) {
        console.error('Get appeals error:', error);
        return NextResponse.json({ error: 'Failed to get appeals' }, { status: 500 });
    }
}
