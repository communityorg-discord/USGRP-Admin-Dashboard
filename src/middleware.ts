import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const host = request.headers.get('host') || '';
    const pathname = request.nextUrl.pathname;

    // If accessing from appeals.usgrp.xyz subdomain
    if (host.startsWith('appeals.')) {
        // Only allow appeal-related routes
        if (pathname === '/' || pathname.startsWith('/appeal')) {
            // Redirect root to /appeal
            if (pathname === '/') {
                return NextResponse.redirect(new URL('/appeal', request.url));
            }
            return NextResponse.next();
        }

        // Block admin routes from appeals subdomain
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/appeals') ||
            pathname.startsWith('/commands') || pathname.startsWith('/backups')) {
            return NextResponse.redirect(new URL('/appeal', request.url));
        }
    }

    // If accessing from admin.usgrp.xyz subdomain
    if (host.startsWith('admin.')) {
        // Block direct access to public appeal form from admin (use /appeals for management)
        if (pathname === '/appeal' || pathname.startsWith('/appeal/')) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
