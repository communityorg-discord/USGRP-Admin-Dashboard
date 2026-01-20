'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Stats {
    cases: { total: number; warns: number; mutes: number; kicks: number; bans: number };
    activity: { messages: number; voiceMinutes: number; uniqueUsers: number };
    members: number;
}

export default function AnalyticsPage() {
    const router = useRouter();
    const [session, setSession] = useState<{ email?: string; permissionName?: string } | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);

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
                    const res = await fetch('/api/bot/stats');
                    if (res.ok) setStats(await res.json());
                } catch { }
            });
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    const navItems = [
        { label: 'Dashboard', href: '/dashboard', icon: '📊' },
        { label: 'User Lookup', href: '/users', icon: '🔍' },
        { label: 'Cases', href: '/cases', icon: '📋' },
        { label: 'Tickets', href: '/tickets', icon: '🎫' },
        { label: 'Analytics', href: '/analytics', icon: '📈', active: true },
    ];

    const adminItems = [
        { label: 'Staff', href: '/staff-dashboard', icon: '👥' },
        { label: 'Appeals', href: '/appeals', icon: '⚖️' },
        { label: 'Backups', href: '/backups', icon: '💾' },
    ];

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">🛡️</div>
                        <div className="sidebar-logo-text">
                            <h1>USGRP Admin</h1>
                            <span>admin.usgrp.xyz</span>
                        </div>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    <div className="nav-section">
                        <div className="nav-section-title">Main</div>
                        {navItems.map((item) => (
                            <Link key={item.label} href={item.href} className={`nav-item ${item.active ? 'active' : ''}`}>
                                <span className="nav-item-icon">{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </div>
                    <div className="nav-section">
                        <div className="nav-section-title">Administration</div>
                        {adminItems.map((item) => (
                            <Link key={item.label} href={item.href} className="nav-item">
                                <span className="nav-item-icon">{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </nav>
                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-email">{session?.email}</div>
                        <div className="user-role">{session?.permissionName || 'MODERATOR'}</div>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">🚪 Sign Out</button>
                </div>
            </aside>

            <main className="admin-main">
                <div style={{ maxWidth: '1200px' }}>
                    <div className="page-header">
                        <h1 className="page-title">Analytics</h1>
                        <p className="page-subtitle">Server activity and moderation statistics</p>
                    </div>

                    <div className="stat-grid" style={{ marginBottom: '24px' }}>
                        <div className="stat-card">
                            <div className="stat-icon">👥</div>
                            <div className="stat-value stat-indigo">{stats?.members?.toLocaleString() ?? '-'}</div>
                            <div className="stat-label">Total Members</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">💬</div>
                            <div className="stat-value stat-purple">{stats?.activity.messages?.toLocaleString() ?? '-'}</div>
                            <div className="stat-label">Messages (30d)</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🎤</div>
                            <div className="stat-value stat-green">{stats?.activity.voiceMinutes ? Math.round(stats.activity.voiceMinutes / 60) + 'h' : '-'}</div>
                            <div className="stat-label">Voice (30d)</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🔥</div>
                            <div className="stat-value stat-amber">{stats?.activity.uniqueUsers ?? '-'}</div>
                            <div className="stat-label">Active Users</div>
                        </div>
                    </div>

                    <div className="content-grid">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Moderation Breakdown</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '8px 0' }}>
                                <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#fbbf24' }}>{stats?.cases.warns ?? '-'}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Warnings</div>
                                </div>
                                <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#fb923c' }}>{stats?.cases.mutes ?? '-'}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mutes</div>
                                </div>
                                <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#f87171' }}>{stats?.cases.kicks ?? '-'}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Kicks</div>
                                </div>
                                <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>{stats?.cases.bans ?? '-'}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Bans</div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Activity Trends</h3>
                            </div>
                            <div className="empty-state">
                                <p>Activity graphs coming soon</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
