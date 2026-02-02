import { NextResponse } from 'next/server';

const ANALYTICS_URL = 'http://localhost:3015';

export async function GET() {
    try {
        const response = await fetch(`${ANALYTICS_URL}/api/activity`, {
            cache: 'no-store'
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Analytics API error' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Analytics API connection failed:', error);
        return NextResponse.json({ error: 'Analytics API not available' }, { status: 503 });
    }
}
