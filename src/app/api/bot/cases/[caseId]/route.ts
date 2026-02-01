import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Bot API configuration
const BOT_API_URL = 'http://localhost:3320';
const BOT_API_KEY = 'usgrp-admin-2026-secure-key-x7k9m2p4';

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

export async function GET(
    request: Request,
    { params }: { params: Promise<{ caseId: string }> }
) {
    const session = await validateSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { caseId } = await params;

    try {
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
    const session = await validateSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only Senior Admin+ can delete cases
    const allowedRoles = ['Senior Administration', 'Developer', 'President'];
    if (!session.roles?.some((r: string) => allowedRoles.includes(r))) {
        return NextResponse.json({ error: 'Insufficient permissions - Senior Admin+ required' }, { status: 403 });
    }

    const { caseId } = await params;

    try {
        const response = await fetch(`${BOT_API_URL}/api/cases/${caseId}`, {
            method: 'DELETE',
            headers: { 
                'X-Admin-Key': BOT_API_KEY,
                'X-Deleted-By': session.discordId || 'unknown',
            },
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            return NextResponse.json({ error: data.error || 'Failed to delete case' }, { status: response.status });
        }

        console.log(`[CASE DELETE] Case ${caseId} deleted by ${session.username} (${session.discordId})`);
        return NextResponse.json({ success: true, message: 'Case deleted' });
    } catch (error) {
        console.error('Error deleting case:', error);
        return NextResponse.json({ error: 'Bot API not available' }, { status: 503 });
    }
}
