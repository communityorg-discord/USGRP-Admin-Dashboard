import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

const AUTH_URL = 'https://auth.usgrp.xyz';

export async function POST() {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        
        // If we have a token, notify auth service to invalidate it
        if (session.authToken) {
            try {
                await fetch(`${AUTH_URL}/api/auth/logout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: session.authToken }),
                });
            } catch (e) {
                // Auth service might be unavailable, continue with local logout
                console.error('Failed to notify auth service of logout:', e);
            }
        }
        
        // Destroy local session
        session.destroy();
        
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
    }
}
