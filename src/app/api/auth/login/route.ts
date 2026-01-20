import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import { verifyCredentials } from '@/lib/imap';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }

        // Verify credentials against IMAP
        const valid = await verifyCredentials(email, password);

        if (!valid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Create session
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        session.email = email;
        session.password = password;
        session.isLoggedIn = true;
        session.lastActivity = Date.now();
        session.isAdmin = true; // All authenticated users are admins for now
        await session.save();

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
