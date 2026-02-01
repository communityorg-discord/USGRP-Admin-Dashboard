import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';

const CITIZEN_API_URL = 'http://localhost:3320';
const API_KEY = 'citizen-portal-key';

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

        const res = await fetch(`${CITIZEN_API_URL}/api/documents/${id}?userId=${user.userId}`, {
            method: 'DELETE',
            headers: { 'x-api-key': API_KEY }
        });

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error deleting document:', error);
        return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
