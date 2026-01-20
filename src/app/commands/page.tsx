'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const COMMANDS = [
    { name: 'warn', category: 'Moderation', description: 'Issue a warning to a user', level: 'MODERATOR' },
    { name: 'mute', category: 'Moderation', description: 'Temporarily mute a user', level: 'MODERATOR' },
    { name: 'unmute', category: 'Moderation', description: 'Remove mute from a user', level: 'MODERATOR' },
    { name: 'kick', category: 'Moderation', description: 'Kick a user from the server', level: 'SENIOR_MOD' },
    { name: 'ban', category: 'Moderation', description: 'Ban a user from the server', level: 'SENIOR_MOD' },
    { name: 'unban', category: 'Moderation', description: 'Unban a user', level: 'SENIOR_MOD' },
    { name: 'case', category: 'Cases', description: 'View or manage a case', level: 'MODERATOR' },
    { name: 'view-history', category: 'Cases', description: 'View user moderation history', level: 'MODERATOR' },
    { name: 'staff', category: 'Staff', description: 'Manage staff accounts', level: 'ADMIN' },
    { name: 'ticket', category: 'Support', description: 'Manage support tickets', level: 'MODERATOR' },
    { name: 'lockdown', category: 'Server', description: 'Lock/unlock channels', level: 'ADMIN' },
    { name: 'purge', category: 'Server', description: 'Bulk delete messages', level: 'MODERATOR' },
];

export default function CommandsPage() {
    const router = useRouter();
    const [session, setSession] = useState<{ email?: string; permissionName?: string } | null>(null);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');

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

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    const categories = [...new Set(COMMANDS.map(c => c.category))];
    const filtered = COMMANDS.filter(c => {
        const matchesSearch = c.name.includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
        const matchesCat = !category || c.category === category;
        return matchesSearch && matchesCat;
    });

    const navItems = [
        { label: 'Dashboard', href: '/dashboard', icon: '📊' },
        { label: 'User Lookup', href: '/users', icon: '🔍' },
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
                            <Link key={item.label} href={item.href} className="nav-item">
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
                        <h1 className="page-title">Commands</h1>
                        <p className="page-subtitle">Bot command reference</p>
                    </div>

                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <input
                                type="text"
                                placeholder="Search commands..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', fontSize: '14px' }}
                            />
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                style={{ padding: '12px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'white', fontSize: '14px' }}
                            >
                                <option value="">All Categories</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Commands ({filtered.length})</h3>
                        </div>
                        {filtered.map((cmd) => (
                            <div key={cmd.name} className="case-item">
                                <div className="case-left">
                                    <span style={{ fontFamily: 'monospace', color: 'var(--accent-primary)', fontWeight: 600 }}>/{cmd.name}</span>
                                    <div className="case-info">
                                        <h4>{cmd.description}</h4>
                                        <p>{cmd.category}</p>
                                    </div>
                                </div>
                                <div className="case-right">
                                    <div className="case-id" style={{ color: cmd.level === 'ADMIN' ? '#f44336' : cmd.level === 'SENIOR_MOD' ? '#ff9800' : '#4caf50' }}>
                                        {cmd.level}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
