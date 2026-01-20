'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSession } from '@/hooks/useSession';

export default function AnalyticsPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [stats, setStats] = useState<{ messagers: Array<{ username: string; count: number }>; voice: Array<{ username: string; minutes: number }> } | null>(null);

    useEffect(() => {
        if (session) {
            fetch('/api/bot/activity/top')
                .then(r => r.ok ? r.json() : null)
                .then(data => data && setStats(data))
                .catch(() => { });
        }
    }, [session]);

    if (sessionLoading) return <div className="admin-layout"><div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div></div>;

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div>
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
