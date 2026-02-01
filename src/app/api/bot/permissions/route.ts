import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/lib/session';

// Bot API configuration
const BOT_API_URL = 'http://localhost:3320';
const BOT_API_KEY = 'usgrp-admin-2026-secure-key-x7k9m2p4';

// Superuser emails
const SUPERUSERS = ['evans@usgrp.xyz', 'dionm@usgrp.xyz'];

export async function POST(request: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

        const userEmail = session.user?.email || session.email;

        if (!session.isLoggedIn || !userEmail) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // Check for hardcoded superusers first
        if (SUPERUSERS.includes(userEmail.toLowerCase())) {
            return NextResponse.json({
                authenticated: true,
                email: userEmail,
                discordId: userEmail.toLowerCase() === 'dionm@usgrp.xyz' ? '723199054514749450' : '415922272956710912',
                displayName: userEmail.toLowerCase() === 'dionm@usgrp.xyz' ? 'Dion M.' : 'Evan S.',
                permissionLevel: 999,
                permissionName: 'SUPERUSER'
            });
        }

        // Call bot API to get permissions for this email
        const response = await fetch(`${BOT_API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Key': BOT_API_KEY
            },
            body: JSON.stringify({ email: userEmail })
        });

        if (!response.ok) {
            // Email not linked - return default permissions
            return NextResponse.json({
                authenticated: true,
                email: userEmail,
                permissionLevel: 1,
                permissionName: 'MODERATOR'
            });
        }

        const data = await response.json();
        return NextResponse.json({
            authenticated: true,
            email: userEmail,
            discordId: data.discordId,
            displayName: data.displayName,
            permissionLevel: data.permissionLevel,
            permissionName: data.permissionName
        });
    } catch (error) {
        console.error('Permission sync failed:', error);
        return NextResponse.json({ error: 'Failed to sync permissions' }, { status: 500 });
    }
}
