'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface UserSession {
    authenticated: boolean;
    userId?: string;
    email?: string;
    discordId?: string;
    permissionLevel?: number;
    permissionName?: string;
    displayName?: string;
}

export function useSession() {
    const router = useRouter();
    const [session, setSession] = useState<UserSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSession() {
            try {
                // Fetch auth session
                const authRes = await fetch('/api/auth/session');
                const authData = await authRes.json();

                if (!authData.authenticated) {
                    router.push('/');
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
                    discordId: permData?.discordId,
                    permissionLevel: permData?.permissionLevel || 1,
                    permissionName: permData?.permissionName || 'MODERATOR',
                    displayName: permData?.displayName || authData.user?.displayName,
                });
            } catch {
                router.push('/');
            } finally {
                setLoading(false);
            }
        }

        fetchSession();
    }, [router]);

    const logout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    return { session, loading, logout };
}
