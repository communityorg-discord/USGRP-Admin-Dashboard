import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            cache: 'no-store',
        });

        clearTimeout(timeout);

        return NextResponse.json({
            status: response.ok ? 'online' : 'offline',
            statusCode: response.status
        });
    } catch (error) {
        return NextResponse.json({
            status: 'offline',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
