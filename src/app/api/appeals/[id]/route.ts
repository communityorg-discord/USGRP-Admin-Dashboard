import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/session';
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const APPEALS_FILE = path.join(DATA_DIR, 'appeals.json');

interface Appeal {
    id: string;
    discordId: string;
    discordUsername: string;
    email: string;
    banReason: string;
    appealMessage: string;
    evidence: string;
    status: 'pending' | 'approved' | 'denied';
    createdAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    reviewNote?: string;
}

function getAppeals(): Appeal[] {
    if (!fs.existsSync(APPEALS_FILE)) return [];
    return JSON.parse(fs.readFileSync(APPEALS_FILE, 'utf8'));
}

function saveAppeals(appeals: Appeal[]) {
    fs.writeFileSync(APPEALS_FILE, JSON.stringify(appeals, null, 2));
}

// GET - Get single appeal by ID (public)
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const appeals = getAppeals();
        const appeal = appeals.find(a => a.id === id);

        if (!appeal) {
            return NextResponse.json({ error: 'Appeal not found' }, { status: 404 });
        }

        // Return limited info for public view
        return NextResponse.json({
            id: appeal.id,
            discordUsername: appeal.discordUsername,
            status: appeal.status,
            createdAt: appeal.createdAt,
            reviewedAt: appeal.reviewedAt,
            reviewNote: appeal.reviewNote,
        });
    } catch (error: unknown) {
        console.error('Get appeal error:', error);
        return NextResponse.json({ error: 'Failed to get appeal' }, { status: 500 });
    }
}

// PATCH - Update appeal status (admin only)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Check authentication
        const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
        if (!session.isLoggedIn) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, reviewNote } = body;

        if (!['approved', 'denied'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const appeals = getAppeals();
        const appealIndex = appeals.findIndex(a => a.id === id);

        if (appealIndex === -1) {
            return NextResponse.json({ error: 'Appeal not found' }, { status: 404 });
        }

        appeals[appealIndex] = {
            ...appeals[appealIndex],
            status,
            reviewNote: reviewNote || '',
            reviewedAt: new Date().toISOString(),
            reviewedBy: session.email,
        };

        saveAppeals(appeals);

        return NextResponse.json({ success: true, appeal: appeals[appealIndex] });
    } catch (error: unknown) {
        console.error('Update appeal error:', error);
        return NextResponse.json({ error: 'Failed to update appeal' }, { status: 500 });
    }
}
