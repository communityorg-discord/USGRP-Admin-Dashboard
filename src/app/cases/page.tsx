'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Case {
    case_id: string;
    user_id: string;
    user_tag: string;
    action_type: string;
    reason: string;
    created_at: string;
    moderator_id: string;
    moderator_tag: string;
    status: string;
}

export default function CasesPage() {
    const router = useRouter();
    const [session, setSession] = useState<{ email?: string; permissionName?: string } | null>(null);
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [search, setSearch] = useState('');

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
                    const res = await fetch('/api/bot/cases');
                    if (res.ok) {
                        setCases(await res.json());
                    }
                } catch { }

                setLoading(false);
            });
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    const filteredCases = cases.filter(c => {
        const matchesFilter = !filter || c.action_type === filter;
        const matchesSearch = !search ||
            c.user_tag?.toLowerCase().includes(search.toLowerCase()) ||
            c.case_id?.toLowerCase().includes(search.toLowerCase()) ||
            c.reason?.toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const actionTypes = [...new Set(cases.map(c => c.action_type))];

    const navItems = [
        { label: 'Dashboard', href: '/dashboard', icon: '📊' },
        { label: 'User Lookup', href: '/users', icon: '🔍' },
        { label: 'Cases', href: '/cases', icon: '📋', active: true },
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
                <div style={{ maxWidth: '1200px' }}>
                    <div className="page-header">
                        <h1 className="page-title">Cases</h1>
                        <p className="page-subtitle">Browse and manage moderation cases</p>
                    </div>

                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <input
                                type="text"
                                placeholder="Search by user, case ID, or reason..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', fontSize: '14px' }}
                            />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', fontSize: '14px', minWidth: '150px' }}
                            >
                                <option value="">All Types</option>
                                {actionTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Cases ({filteredCases.length})</h3>
                        </div>
                        {loading ? (
                            <div className="empty-state">Loading cases...</div>
                        ) : filteredCases.length > 0 ? (
                            filteredCases.map((c) => (
                                <div key={c.case_id} className="case-item">
                                    <div className="case-left">
                                        <span className={`case-badge badge-${c.action_type}`}>{c.action_type.toUpperCase()}</span>
                                        <div className="case-info">
                                            <h4>{c.user_tag}</h4>
                                            <p>{c.reason || 'No reason provided'}</p>
                                        </div>
                                    </div>
                                    <div className="case-right">
                                        <div className="case-id">{c.case_id}</div>
                                        <div className="case-date">{new Date(c.created_at).toLocaleDateString()}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>by {c.moderator_tag}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">No cases found</div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
