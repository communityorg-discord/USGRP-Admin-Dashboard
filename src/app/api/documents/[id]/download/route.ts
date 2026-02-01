import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

const CITIZEN_API_URL = 'http://localhost:3320';
const API_KEY = 'usgrp-admin-2026-secure-key-x7k9m2p4';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        const user = session.user;

        if (!user || !user.userId) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        const id = (await params).id;
        const email = user.email || '';

        const res = await fetch(`${CITIZEN_API_URL}/api/documents/download/${id}?userId=${user.userId}&email=${encodeURIComponent(email)}`, {
            headers: { 'x-api-key': API_KEY }
        });

        if (!res.ok) {
            const data = await res.json();
            return NextResponse.json(data, { status: res.status });
        }

        // Forward headers
        const headers = new Headers();
        headers.set('Content-Disposition', res.headers.get('Content-Disposition') || '');
        headers.set('Content-Type', res.headers.get('Content-Type') || 'application/octet-stream');
        headers.set('Content-Length', res.headers.get('Content-Length') || '');

        return new NextResponse(res.body, {
            status: 200,
            headers: headers
        });
    } catch (error) {
        console.error('Error downloading document:', error);
        return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
