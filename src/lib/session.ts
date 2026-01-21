import { SessionOptions } from 'iron-session';

export interface AuthUser {
    userId: string;
    email: string;
    discordId: string | null;
    displayName: string;
    authorityLevel: number;
    roles: string[];
    permissions: string[];
    sessionId: string;
}

export interface SessionData {
    authToken?: string;
    user?: AuthUser;
    isLoggedIn: boolean;
    lastActivity?: number;

    // Legacy fields - kept for migration
    email?: string;
    password?: string;
    isAdmin?: boolean;
}

export const sessionOptions: SessionOptions = {
    password: process.env.SESSION_SECRET || 'usgrp-admin-dashboard-secret-key-32chars!',
    cookieName: 'usgrp-admin-session',
    cookieOptions: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
    },
};

export const defaultSession: SessionData = {
    isLoggedIn: false,
};
