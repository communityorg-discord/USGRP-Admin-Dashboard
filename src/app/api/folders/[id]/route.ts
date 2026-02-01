import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

const CITIZEN_API_URL = 'http://localhost:3320';
const API_KEY = 'usgrp-admin-2026-secure-key-x7k9m2p4';

export async function DELETE(
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

        const res = await fetch(`${CITIZEN_API_URL}/api/folders/${id}?userId=${user.userId}`, {
            method: 'DELETE',
            headers: { 
                'x-api-key': API_KEY,
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('Error deleting folder:', error);
        return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(
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
        const body = await req.json();

        const res = await fetch(`${CITIZEN_API_URL}/api/folders/${id}`, {
            method: 'PUT',
            headers: { 
                'x-api-key': API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: body.name,
                userId: user.userId
            })
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        console.error('Error updating folder:', error);
        return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
