'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserData {
    user: {
        id: string;
        username?: string;
        displayName?: string;
        avatar?: string;
        nickname?: string;
        roles?: Array<{ id: string; name: string; color: string }>;
        joinedAt?: string;
        permissionLevel?: number;
    };
    cases: Array<{
        case_id: string;
        action_type: string;
        reason: string;
        created_at: string;
        moderator_tag: string;
        status: string;
    }>;
    caseCount: number;
    activity: {
        totalMessages: number;
        totalVoice: number;
        activeDays: number;
    };
}

export default function UsersPage() {
    const router = useRouter();
    const [session, setSession] = useState<{ email?: string; permissionName?: string } | null>(null);
    const [searchId, setSearchId] = useState('');
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                if (!data.authenticated) {
                    router.push('/');
                } else {
                    setSession(data);
                }
            });
    }, [router]);

    const handleSearch = async () => {
        if (!searchId.trim()) return;

        setLoading(true);
        setError('');
        setUser(null);

        try {
            const res = await fetch(`/api/bot/users/${searchId}`);
            if (!res.ok) throw new Error('User not found');
            setUser(await res.json());
        } catch {
            setError('Could not fetch user. Make sure bot API is running.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    const navItems = [
        { label: 'Dashboard', href: '/dashboard', icon: '📊' },
        { label: 'User Lookup', href: '/users', icon: '🔍', active: true },
        { label: 'Cases', href: '/cases', icon: '📋' },
        { label: 'Tickets', href: '/tickets', icon: '🎫' },
        { label: 'Analytics', href: '/analytics', icon: '📈' },
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
                <div style={{ maxWidth: '1000px' }}>
                    <div className="page-header">
                        <h1 className="page-title">User Lookup</h1>
                        <p className="page-subtitle">Search by Discord ID to view moderation history</p>
                    </div>

                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Enter Discord User ID..."
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', fontSize: '14px' }}
                            />
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                style={{ padding: '12px 24px', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                            >
                                {loading ? 'Searching...' : 'Search'}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="alert-warning" style={{ marginBottom: '24px' }}>
                            {error}
                        </div>
                    )}

                    {user && (
                        <>
                            <div className="card" style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                    {user.user.avatar ? (
                                        <img src={user.user.avatar} alt="" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
                                    ) : (
                                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>👤</div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>{user.user.displayName || user.user.username || 'Unknown User'}</h2>
                                        <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>@{user.user.username}</p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>ID: {user.user.id}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ textAlign: 'center', padding: '12px 20px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-primary)' }}>{user.caseCount}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cases</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '12px 20px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#9c27b0' }}>{user.activity.totalMessages}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Messages</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '12px 20px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#4caf50' }}>{Math.round(user.activity.totalVoice / 60)}h</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Voice</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Moderation History</h3>
                                </div>
                                {user.cases.length > 0 ? user.cases.map((c) => (
                                    <div key={c.case_id} className="case-item">
                                        <div className="case-left">
                                            <span className={`case-badge badge-${c.action_type}`}>{c.action_type.toUpperCase()}</span>
                                            <div className="case-info">
                                                <h4>{c.reason || 'No reason provided'}</h4>
                                                <p>By {c.moderator_tag}</p>
                                            </div>
                                        </div>
                                        <div className="case-right">
                                            <div className="case-id">{c.case_id}</div>
                                            <div className="case-date">{new Date(c.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="empty-state">No moderation history</div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
