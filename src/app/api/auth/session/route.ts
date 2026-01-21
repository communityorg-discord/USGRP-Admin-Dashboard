import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { validateAuthToken } from '@/lib/authClient';

export async function GET() {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

        if (!session.isLoggedIn || !session.authToken) {
            return NextResponse.json({ authenticated: false });
        }

        // Validate token with Auth service
        const validation = await validateAuthToken(session.authToken);

        if (!validation.valid) {
            session.isLoggedIn = false;
            session.authToken = undefined;
            session.user = undefined;
            await session.save();

            return NextResponse.json({
                authenticated: false,
                error: validation.error
            });
        }

        return NextResponse.json({
            authenticated: true,
            user: session.user,
        });

    } catch (error: unknown) {
        console.error('Session check error:', error);
        return NextResponse.json({ authenticated: false });
    }
}
