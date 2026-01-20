import { NextRequest, NextResponse } from 'next/server';

// Bot API configuration
const BOT_API_URL = 'http://localhost:3003';
const BOT_API_KEY = 'usgrp-admin-2026-secure-key-x7k9m2p4';

export async function GET() {
    try {
        const response = await fetch(`${BOT_API_URL}/api/cases?limit=10`, {
            headers: { 'X-Admin-Key': BOT_API_KEY },
            cache: 'no-store'
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Bot API error' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Bot API connection failed:', error);
        return NextResponse.json({ error: 'Bot API not available' }, { status: 503 });
    }
}
