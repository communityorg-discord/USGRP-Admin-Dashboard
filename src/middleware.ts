import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const host = request.headers.get('host') || '';
    const pathname = request.nextUrl.pathname;

    // If accessing from appeals.usgrp.xyz subdomain
    if (host.startsWith('appeals.')) {
        // Redirect root to /appeal
        if (pathname === '/') {
            return NextResponse.redirect(new URL('/appeal', request.url));
        }
        
        // Allow appeal-related routes and API
        if (pathname.startsWith('/appeal') || pathname.startsWith('/api/appeals')) {
            return NextResponse.next();
        }

        // Allow Next.js assets
        if (pathname.startsWith('/_next') || pathname === '/favicon.ico') {
            return NextResponse.next();
        }

        // Block all other routes - redirect to appeal
        return NextResponse.redirect(new URL('/appeal', request.url));
    }

    // Auth endpoints should always be accessible
    if (pathname.startsWith('/api/auth/')) {
        return NextResponse.next();
    }

    // All other routes pass through normally
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
