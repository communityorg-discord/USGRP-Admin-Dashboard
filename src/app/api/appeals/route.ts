import { NextRequest, NextResponse } from 'next/server';
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
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(APPEALS_FILE)) {
        fs.writeFileSync(APPEALS_FILE, '[]');
        return [];
    }
    return JSON.parse(fs.readFileSync(APPEALS_FILE, 'utf8'));
}

function saveAppeals(appeals: Appeal[]) {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(APPEALS_FILE, JSON.stringify(appeals, null, 2));
}

function generateAppealId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = 'APL-';
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// POST - Create new appeal (public)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { discordId, discordUsername, email, banReason, appealMessage, evidence } = body;

        if (!discordId || !discordUsername || !email || !appealMessage) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const appeals = getAppeals();

        // Check for existing pending appeal
        const existingPending = appeals.find(
            a => a.discordId === discordId && a.status === 'pending'
        );
        if (existingPending) {
            return NextResponse.json({
                error: 'You already have a pending appeal',
                appealId: existingPending.id
            }, { status: 400 });
        }

        const appeal: Appeal = {
            id: generateAppealId(),
            discordId,
            discordUsername,
            email,
            banReason: banReason || '',
            appealMessage,
            evidence: evidence || '',
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        appeals.push(appeal);
        saveAppeals(appeals);

        return NextResponse.json({ success: true, appealId: appeal.id });
    } catch (error: unknown) {
        console.error('Appeal submission error:', error);
        return NextResponse.json({ error: 'Failed to submit appeal' }, { status: 500 });
    }
}

// GET - List all appeals (admin only, but we'll check auth separately)
export async function GET() {
    try {
        const appeals = getAppeals();
        return NextResponse.json(appeals.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
    } catch (error: unknown) {
        console.error('Get appeals error:', error);
        return NextResponse.json({ error: 'Failed to get appeals' }, { status: 500 });
    }
}
