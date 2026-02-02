import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

// Bot API configuration
const BOT_API_URL = 'http://localhost:3320';
const BOT_API_KEY = 'usgrp-admin-2026-secure-key-x7k9m2p4';

// Allowed roles for case management
const ALLOWED_ROLES = [
    'Senior Administration',
    'Developer', 
    'President',
    'Chief of Staff',
    'Vice President',
];

export async function GET(
    request: Request,
    { params }: { params: Promise<{ caseId: string }> }
) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.isLoggedIn || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { caseId } = await params;

        const response = await fetch(`${BOT_API_URL}/api/cases/${caseId}`, {
            headers: { 'X-Admin-Key': BOT_API_KEY },
            cache: 'no-store'
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Case not found' }, { status: 404 });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching case:', error);
        return NextResponse.json({ error: 'Bot API not available' }, { status: 503 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ caseId: string }> }
) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        
        if (!session.isLoggedIn || !session.user) {
            return NextResponse.json({ error: 'Unauthorized - Not logged in' }, { status: 401 });
        }

        // Check roles
        const userRoles = session.user.roles || [];
        const hasPermission = ALLOWED_ROLES.some(role => userRoles.includes(role)) || 
                              (session.user.authorityLevel && session.user.authorityLevel >= 4);
        
        if (!hasPermission) {
            return NextResponse.json({ 
                error: 'Insufficient permissions - Senior Admin+ required' 
            }, { status: 403 });
        }

        const { caseId } = await params;

        const response = await fetch(`${BOT_API_URL}/api/cases/${caseId}`, {
            method: 'DELETE',
            headers: { 
                'X-Admin-Key': BOT_API_KEY,
                'X-Deleted-By': session.user.discordId || 'unknown',
            },
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            return NextResponse.json({ error: data.error || 'Failed to delete case' }, { status: response.status });
        }

        console.log(`[CASE DELETE] Case ${caseId} deleted by ${session.user.displayName} (${session.user.discordId})`);
        return NextResponse.json({ success: true, message: 'Case deleted' });
    } catch (error) {
        console.error('Error deleting case:', error);
        return NextResponse.json({ error: 'Bot API not available' }, { status: 503 });
    }
}
