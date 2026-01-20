'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function AnalyticsPage() {
    const router = useRouter();
    const [session, setSession] = useState<{ email?: string; permissionName?: string } | null>(null);
    const [stats, setStats] = useState<{ messagers: Array<{ username: string; count: number }>; voice: Array<{ username: string; minutes: number }> } | null>(null);

    useEffect(() => {
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(async (data) => {
                if (!data.authenticated) {
                    router.push('/');
                    return;
                }
                setSession(data);

                try {
                    const res = await fetch('/api/bot/activity/top');
                    if (res.ok) setStats(await res.json());
                } catch { }
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
                <div style={{ maxWidth: '1200px' }}>
                    <div className="page-header">
                        <h1 className="page-title">Analytics</h1>
                        <p className="page-subtitle">Server activity and engagement metrics</p>
                    </div>

                    <div className="content-grid">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">💬 Top Messagers (30d)</h3>
                            </div>
                            {stats?.messagers && stats.messagers.length > 0 ? (
                                <div>
                                    {stats.messagers.slice(0, 10).map((u, i) => (
                                        <div key={i} className="case-item" style={{ padding: '12px 0' }}>
                                            <div className="case-left">
                                                <span style={{ fontWeight: 600, color: i < 3 ? 'var(--accent-warning)' : 'var(--text-primary)', minWidth: '24px' }}>#{i + 1}</span>
                                                <span style={{ marginLeft: '12px' }}>{u.username}</span>
                                            </div>
                                            <div className="case-right">
                                                <span style={{ color: 'var(--accent-primary)' }}>{u.count.toLocaleString()} msgs</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">No data yet</div>
                            )}
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">🎙️ Top Voice Users (30d)</h3>
                            </div>
                            {stats?.voice && stats.voice.length > 0 ? (
                                <div>
                                    {stats.voice.slice(0, 10).map((u, i) => (
                                        <div key={i} className="case-item" style={{ padding: '12px 0' }}>
                                            <div className="case-left">
                                                <span style={{ fontWeight: 600, color: i < 3 ? 'var(--accent-warning)' : 'var(--text-primary)', minWidth: '24px' }}>#{i + 1}</span>
                                                <span style={{ marginLeft: '12px' }}>{u.username}</span>
                                            </div>
                                            <div className="case-right">
                                                <span style={{ color: '#4caf50' }}>{Math.round(u.minutes / 60)}h</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">No data yet</div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
