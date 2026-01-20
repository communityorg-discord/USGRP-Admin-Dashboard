'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Official {
    govId: string;
    discordId: string;
    username: string | null;
    avatar: string | null;
    position: string;
    positionKey: string;
    assignedAt: string;
    registeredAt: string;
}

export default function GovernmentPage() {
    const router = useRouter();
    const [session, setSession] = useState<{ email?: string; permissionName?: string } | null>(null);
    const [officials, setOfficials] = useState<Official[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

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
                    const res = await fetch('/api/bot/government');
                    if (res.ok) {
                        const govData = await res.json();
                        setOfficials(govData.officials || []);
                        setLastUpdated(govData.lastUpdated);
                    }
                } catch { }

                setLoading(false);
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
        { label: 'Analytics', href: '/analytics', icon: '📈' },
    ];

    const adminItems = [
        { label: 'Staff', href: '/staff-dashboard', icon: '👥' },
        { label: 'Government', href: '/government', icon: '🏛️', active: true },
        { label: 'Appeals', href: '/appeals', icon: '⚖️' },
        { label: 'Backups', href: '/backups', icon: '💾' },
    ];

    // Group officials by category
    const executiveOffice = officials.filter(o => ['president', 'vicePresident', 'whiteHouseChiefOfStaff'].includes(o.positionKey) || o.positionKey.startsWith('wh'));
    const cabinet = officials.filter(o => o.positionKey.startsWith('secretaryOf'));
    const agencies = officials.filter(o => !executiveOffice.includes(o) && !cabinet.includes(o));

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
                            <Link key={item.label} href={item.href} className="nav-item">
                                <span className="nav-item-icon">{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </div>
                    <div className="nav-section">
                        <div className="nav-section-title">Administration</div>
                        {adminItems.map((item) => (
                            <Link key={item.label} href={item.href} className={`nav-item ${item.active ? 'active' : ''}`}>
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
                    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 className="page-title">Government Officials</h1>
                            <p className="page-subtitle">Current administration appointments from autorole</p>
                        </div>
                        {lastUpdated && (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Last updated: {new Date(lastUpdated).toLocaleString()}
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="card"><div className="empty-state">Loading officials...</div></div>
                    ) : (
                        <>
                            {/* Executive Office */}
                            {executiveOffice.length > 0 && (
                                <div className="card" style={{ marginBottom: '24px' }}>
                                    <div className="card-header">
                                        <h3 className="card-title">🏛️ Executive Office ({executiveOffice.length})</h3>
                                    </div>
                                    <div className="official-grid">
                                        {executiveOffice.map((o) => (
                                            <div key={o.govId} className="official-card">
                                                {o.avatar ? (
                                                    <img src={o.avatar} alt="" className="official-avatar" />
                                                ) : (
                                                    <div className="official-avatar-placeholder">👤</div>
                                                )}
                                                <div className="official-info">
                                                    <div className="official-name">{o.username || o.discordId}</div>
                                                    <div className="official-position">{o.position}</div>
                                                    <div className="official-meta">
                                                        <span className="official-id">{o.govId}</span>
                                                        <span className="official-since">Since {new Date(o.assignedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Cabinet */}
                            {cabinet.length > 0 && (
                                <div className="card" style={{ marginBottom: '24px' }}>
                                    <div className="card-header">
                                        <h3 className="card-title">📋 Cabinet Secretaries ({cabinet.length})</h3>
                                    </div>
                                    <div className="official-grid">
                                        {cabinet.map((o) => (
                                            <div key={o.govId} className="official-card">
                                                {o.avatar ? (
                                                    <img src={o.avatar} alt="" className="official-avatar" />
                                                ) : (
                                                    <div className="official-avatar-placeholder">👤</div>
                                                )}
                                                <div className="official-info">
                                                    <div className="official-name">{o.username || o.discordId}</div>
                                                    <div className="official-position">{o.position}</div>
                                                    <div className="official-meta">
                                                        <span className="official-id">{o.govId}</span>
                                                        <span className="official-since">Since {new Date(o.assignedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Agencies */}
                            {agencies.length > 0 && (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">🏢 Agency Directors & Other ({agencies.length})</h3>
                                    </div>
                                    <div className="official-grid">
                                        {agencies.map((o) => (
                                            <div key={o.govId} className="official-card">
                                                {o.avatar ? (
                                                    <img src={o.avatar} alt="" className="official-avatar" />
                                                ) : (
                                                    <div className="official-avatar-placeholder">👤</div>
                                                )}
                                                <div className="official-info">
                                                    <div className="official-name">{o.username || o.discordId}</div>
                                                    <div className="official-position">{o.position}</div>
                                                    <div className="official-meta">
                                                        <span className="official-id">{o.govId}</span>
                                                        <span className="official-since">Since {new Date(o.assignedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {officials.length === 0 && (
                                <div className="card">
                                    <div className="empty-state">
                                        <p>No government officials found</p>
                                        <p style={{ marginTop: '8px', fontSize: '12px' }}>Officials assigned via /autorole will appear here.</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
