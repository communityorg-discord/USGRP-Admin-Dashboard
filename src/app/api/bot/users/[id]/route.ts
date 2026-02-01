import { NextRequest, NextResponse } from 'next/server';

// Bot API configuration
const BOT_API_URL = 'http://localhost:3320';
const BOT_API_KEY = 'usgrp-admin-2026-secure-key-x7k9m2p4';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const response = await fetch(`${BOT_API_URL}/api/users/${id}`, {
            headers: { 'X-Admin-Key': BOT_API_KEY },
            cache: 'no-store'
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'User not found' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Bot API connection failed:', error);
        return NextResponse.json({ error: 'Bot API not available' }, { status: 503 });
    }
}
