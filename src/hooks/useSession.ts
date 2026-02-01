'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface UserSession {
    authenticated: boolean;
    userId?: string;
    email?: string;
    discordId?: string;
    permissionLevel?: number;
    permissionName?: string;
    displayName?: string;
    authorityLevel?: number;
}

export function useSession() {
    const router = useRouter();
    const [session, setSession] = useState<UserSession | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSession = useCallback(async () => {
        try {
            // Fetch auth session
            const authRes = await fetch('/api/auth/session');
            const authData = await authRes.json();

            if (!authData.authenticated) {
                // If session expired, redirect with a cleaner message
                if (authData.sessionExpired) {
                    router.push('/?expired=1');
                } else {
                    router.push('/');
                }
                return;
            }

            // Fetch permissions from bot API
            let permData = null;
            try {
                const permRes = await fetch('/api/bot/permissions', { method: 'POST' });
                if (permRes.ok) {
                    permData = await permRes.json();
                }
            } catch {
                // Bot API not available
            }

            setSession({
                authenticated: true,
                userId: authData.user?.userId,
                email: authData.user?.email || authData.email,
                discordId: permData?.discordId || authData.user?.discordId,
                permissionLevel: permData?.permissionLevel || 1,
                permissionName: permData?.permissionName || 'MODERATOR',
                displayName: permData?.displayName || authData.user?.displayName,
                authorityLevel: authData.user?.authorityLevel,
            });
        } catch {
            router.push('/');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Logout failed:', e);
        }
        router.push('/');
    };

    const refresh = () => {
        setLoading(true);
        fetchSession();
    };

    return { session, loading, logout, refresh };
}
