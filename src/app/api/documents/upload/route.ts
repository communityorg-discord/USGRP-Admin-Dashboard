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

        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ ok: false, error: 'No file provided' }, { status: 400 });
        }

        const backendFormData = new FormData();
        backendFormData.append('file', file);
        backendFormData.append('userId', user.userId);
        backendFormData.append('title', formData.get('title') || '');
        backendFormData.append('description', formData.get('description') || '');
        backendFormData.append('category', formData.get('category') || 'General');
        backendFormData.append('accessLevel', formData.get('accessLevel') || 'private');

        const res = await fetch(`${CITIZEN_API_URL}/api/documents/upload`, {
            method: 'POST',
            headers: { 'x-api-key': API_KEY },
            body: backendFormData
        });

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error uploading document:', error);
        return NextResponse.json({ ok: false, error: 'Upload failed' }, { status: 500 });
    }
}
