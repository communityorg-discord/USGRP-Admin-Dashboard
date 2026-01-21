import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

// Force dynamic rendering - this route uses request.url and cookies
export const dynamic = 'force-dynamic';

const AUTH_URL = 'https://auth.usgrp.xyz';
const APP_URL = 'https://admin.usgrp.xyz';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            return NextResponse.redirect(`${APP_URL}/?error=${encodeURIComponent(error)}`);
        }

        if (!token) {
            return NextResponse.redirect(`${APP_URL}/?error=No token provided`);
        }

        // Validate token with Auth service
        let validateRes;
        try {
            validateRes = await fetch(`${AUTH_URL}/api/auth/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, service: 'Admin Dashboard' }),
            });
        } catch (fetchError) {
            console.error('Fetch to Auth failed:', fetchError);
            return NextResponse.redirect(`${APP_URL}/?error=Cannot connect to Auth service`);
        }

        const validateData = await validateRes.json();

        if (!validateRes.ok || !validateData.valid) {
            return NextResponse.redirect(`${APP_URL}/?error=${encodeURIComponent(validateData.error || 'Invalid token')}`);
        }

        // Create local session
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        session.authToken = token;
        session.user = validateData.user;
        session.isLoggedIn = true;
        session.lastActivity = Date.now();
        await session.save();

        // Redirect to dashboard
        return NextResponse.redirect(`${APP_URL}/dashboard`);

    } catch (error: unknown) {
        console.error('Auth callback error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.redirect(`${APP_URL}/?error=${encodeURIComponent('Callback failed: ' + message)}`);
    }
}

