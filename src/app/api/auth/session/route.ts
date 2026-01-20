import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

export async function GET() {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

        if (session.isLoggedIn) {
            return NextResponse.json({
                authenticated: true,
                email: session.email,
                isAdmin: session.isAdmin
            });
        }

        return NextResponse.json({ authenticated: false });
    } catch (error: unknown) {
        console.error('Session check error:', error);
        return NextResponse.json({ authenticated: false });
    }
}
