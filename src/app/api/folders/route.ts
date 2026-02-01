import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

const CITIZEN_API_URL = 'http://localhost:3320';
const API_KEY = 'usgrp-admin-2026-secure-key-x7k9m2p4';

export async function POST(req: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        const user = session.user;

        if (!user || !user.userId) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        const res = await fetch(`${CITIZEN_API_URL}/api/folders`, {
            method: 'POST',
            headers: { 
                'x-api-key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: body.name,
                userId: user.userId,
                parentId: body.parentId
            })
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('Error creating folder:', error);
        return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
