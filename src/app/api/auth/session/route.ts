import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

const BOT_API_URL = 'http://localhost:3003';
const BOT_API_KEY = 'usgrp-admin-2026-secure-key-x7k9m2p4';

export async function GET() {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

        if (session.isLoggedIn) {
            // Fetch permissions from bot API
            let permissionData = null;
            try {
                const permRes = await fetch(`${BOT_API_URL}/api/auth/permissions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Admin-Key': BOT_API_KEY
                    },
                    body: JSON.stringify({ email: session.email }),
                    cache: 'no-store'
                });
                if (permRes.ok) {
                    permissionData = await permRes.json();
                }
            } catch {
                // Bot API not available, use defaults
            }

            return NextResponse.json({
                authenticated: true,
                email: session.email,
                isAdmin: session.isAdmin,
                discordId: permissionData?.discordId,
                permissionLevel: permissionData?.permissionLevel || 1,
                permissionName: permissionData?.permissionName || 'MODERATOR',
                displayName: permissionData?.displayName
            });
        }

        return NextResponse.json({ authenticated: false });
    } catch (error: unknown) {
        console.error('Session check error:', error);
        return NextResponse.json({ authenticated: false });
    }
}
