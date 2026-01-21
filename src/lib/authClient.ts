/**
 * USGRP Auth Client for Admin Dashboard
 */

const AUTH_URL = 'https://auth.usgrp.xyz';

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

export interface TokenValidationResult {
    valid: boolean;
    user?: AuthUser;
    error?: string;
}

export async function validateAuthToken(token: string): Promise<TokenValidationResult> {
    try {
        const response = await fetch(`${AUTH_URL}/api/auth/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            cache: 'no-store',
        });

        const data = await response.json();

        if (!response.ok || !data.valid) {
            return { valid: false, error: data.error || 'Token validation failed' };
        }

        return { valid: true, user: data.user };
    } catch (error) {
        console.error('Auth token validation error:', error);
        return { valid: false, error: 'Auth service unavailable' };
    }
}

export function getAuthRedirectUrl(returnUrl: string): string {
    const encoded = encodeURIComponent(returnUrl);
    return `${AUTH_URL}/login?return=${encoded}`;
}

export function hasMinimumAuthority(user: AuthUser | null | undefined, requiredLevel: number): boolean {
    if (!user) return false;
    return user.authorityLevel >= requiredLevel;
}

export function hasPermission(user: AuthUser | null | undefined, permission: string): boolean {
    if (!user) return false;
    return user.permissions.includes(permission);
}

export const AUTHORITY_LEVELS = {
    USER: 0,
    MODERATOR: 1,
    SENIOR_MOD: 2,
    ADMIN: 3,
    HR: 4,
    SUPERUSER: 5,
    BOT_DEVELOPER: 6,
} as const;

export const PERMISSIONS = {
    DASHBOARD_VIEW: 'dashboard:view',
    DASHBOARD_APPEALS: 'dashboard:appeals',
    DASHBOARD_USERS: 'dashboard:users',
    DASHBOARD_ANALYTICS: 'dashboard:analytics',
} as const;
