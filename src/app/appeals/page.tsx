'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function AppealsPage() {
    const router = useRouter();
    const [session, setSession] = useState<{ email?: string; permissionName?: string } | null>(null);

    useEffect(() => {
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                if (!data.authenticated) router.push('/');
                else setSession(data);
            });
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={handleLogout} />

            <main className="admin-main">
                <div style={{ maxWidth: '1000px' }}>
                    <div className="page-header">
                        <h1 className="page-title">Appeals</h1>
                        <p className="page-subtitle">Review and manage ban/mute appeals</p>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">⚖️ Pending Appeals</h3>
                        </div>
                        <div className="empty-state">
                            <p>No pending appeals</p>
                            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>Appeals submitted at usgrp.xyz/appeal will appear here.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
