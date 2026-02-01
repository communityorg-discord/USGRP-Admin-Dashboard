import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

const CITIZEN_API_URL = 'http://localhost:3320';
const API_KEY = 'usgrp-admin-2026-secure-key-x7k9m2p4';

export async function GET(req: NextRequest) {
    try {
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        const user = session.user;

        if (!user || !user.userId) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const folderId = searchParams.get('folderId');
        const email = searchParams.get('email') || user.email;

        let url = `${CITIZEN_API_URL}/api/documents/${user.userId}`;
        const query = new URLSearchParams();
        if (category) query.append('category', category);
        if (search) query.append('search', search);
        if (folderId) query.append('folderId', folderId);
        if (email) query.append('email', email);
        
        if (query.toString()) url += `?${query.toString()}`;

        const res = await fetch(url, {
            headers: { 'x-api-key': API_KEY }
        });

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching documents:', error);
        return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
