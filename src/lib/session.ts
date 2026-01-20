import { SessionOptions } from 'iron-session';

export interface SessionData {
    email: string;
    password: string;
    isLoggedIn: boolean;
    lastActivity?: number;
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
    email: '',
    password: '',
    isLoggedIn: false,
};
