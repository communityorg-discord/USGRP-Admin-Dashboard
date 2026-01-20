'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface StaffAccount {
    discord_id: string;
    email: string;
    display_name: string;
    permission_level: string;
    linked_at: string;
    linked_by: string;
}

export default function StaffDashboardPage() {
    const router = useRouter();
    const [session, setSession] = useState<{ email?: string; permissionName?: string } | null>(null);
    const [staff, setStaff] = useState<StaffAccount[]>([]);
    const [loading, setLoading] = useState(true);

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
                    const res = await fetch('/api/bot/staff');
                    if (res.ok) {
                        setStaff(await res.json());
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
        { label: 'Staff', href: '/staff-dashboard', icon: '👥', active: true },
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
                    <div className="page-header">
                        <h1 className="page-title">Staff Management</h1>
                        <p className="page-subtitle">Linked staff accounts and permissions</p>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Staff Accounts ({staff.length})</h3>
                        </div>
                        {loading ? (
                            <div className="empty-state">Loading staff...</div>
                        ) : staff.length > 0 ? (
                            staff.map((s) => (
                                <div key={s.discord_id} className="case-item">
                                    <div className="case-left">
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                            👤
                                        </div>
                                        <div className="case-info">
                                            <h4>{s.display_name || 'Unknown'}</h4>
                                            <p>{s.email}</p>
                                        </div>
                                    </div>
                                    <div className="case-right">
                                        <div className="case-id" style={{ color: 'var(--accent-primary)' }}>{s.permission_level || 'STAFF'}</div>
                                        <div className="case-date">Linked {new Date(s.linked_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <p>No staff accounts linked</p>
                                <p style={{ marginTop: '8px', fontSize: '12px' }}>Use /staff add in Discord to link accounts.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
