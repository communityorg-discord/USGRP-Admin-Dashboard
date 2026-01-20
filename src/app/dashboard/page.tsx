'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Stats {
    cases: { total: number; warns: number; mutes: number; kicks: number; bans: number; active: number };
    tickets: { total: number; open: number; closed: number };
    activity: { messages: number; voiceMinutes: number; uniqueUsers: number };
    staff: number;
    members: number;
}

interface Case {
    case_id: string;
    user_tag: string;
    action_type: string;
    reason: string;
    created_at: string;
    moderator_tag: string;
}

interface UserSession {
    authenticated: boolean;
    email?: string;
    discordId?: string;
    permissionLevel?: number;
    permissionName?: string;
    displayName?: string;
}

interface WidgetConfig {
    stats: boolean;
    cases: boolean;
    actions: boolean;
    services: boolean;
}

export default function DashboardPage() {
    const router = useRouter();
    const [session, setSession] = useState<UserSession | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentCases, setRecentCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiConnected, setApiConnected] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [widgets, setWidgets] = useState<WidgetConfig>({
        stats: true,
        cases: true,
        actions: true,
        services: true,
    });
    const [showWidgetMenu, setShowWidgetMenu] = useState(false);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Load widget config from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('dashboard-widgets');
        if (saved) {
            try {
                setWidgets(JSON.parse(saved));
            } catch { }
        }
    }, []);

    // Save widget config
    const toggleWidget = (key: keyof WidgetConfig) => {
        const updated = { ...widgets, [key]: !widgets[key] };
        setWidgets(updated);
        localStorage.setItem('dashboard-widgets', JSON.stringify(updated));
    };

    useEffect(() => {
        Promise.all([
            fetch('/api/auth/session').then(r => r.json()),
            fetch('/api/bot/permissions', { method: 'POST' }).then(r => r.json()).catch(() => null)
        ]).then(async ([authData, permData]) => {
            if (!authData.authenticated) {
                router.push('/');
                return;
            }

            setSession({
                ...authData,
                permissionLevel: permData?.permissionLevel || 1,
                permissionName: permData?.permissionName || 'MODERATOR',
                discordId: permData?.discordId,
                displayName: permData?.displayName
            });

            try {
                const statsRes = await fetch('/api/bot/stats');
                if (statsRes.ok) {
                    setStats(await statsRes.json());
                    setApiConnected(true);
                }
            } catch { }

            try {
                const casesRes = await fetch('/api/bot/cases');
                if (casesRes.ok) {
                    setRecentCases(await casesRes.json());
                }
            } catch { }

            setLoading(false);
        });
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    if (loading) {
        return (
            <div className="admin-layout" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#2196f3', fontSize: '18px' }}>Loading...</div>
            </div>
        );
    }

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const formatDate = () => {
        return currentTime.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = () => {
        return currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getUserName = () => {
        if (session?.displayName) return session.displayName;
        if (session?.email) return session.email.split('@')[0];
        return 'Admin';
    };

    const navItems = [
        { label: 'Dashboard', href: '/dashboard', icon: '📊', active: true },
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
            {/* Sidebar */}
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

                    <div className="nav-section">
                        <div className="nav-section-title">External</div>
                        <a href="https://mail.usgrp.xyz" target="_blank" className="nav-item">
                            <span className="nav-item-icon">📧</span>
                            Webmail
                        </a>
                    </div>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-email">{session?.email}</div>
                        <div className="user-role">{session?.permissionName || 'MODERATOR'}</div>
                    </div>
                    <button onClick={handleLogout} className="logout-btn">
                        🚪 Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <div style={{ maxWidth: '1400px' }}>
                    {/* Welcome Header */}
                    <div className="welcome-header">
                        <div className="welcome-left">
                            <h1 className="welcome-greeting">{getGreeting()}, {getUserName()}</h1>
                            <p className="welcome-subtitle">Welcome to the USGRP Admin Dashboard</p>
                        </div>
                        <div className="welcome-right">
                            <div className="datetime-display">
                                <div className="datetime-time">{formatTime()}</div>
                                <div className="datetime-date">{formatDate()}</div>
                            </div>
                            <div className="widget-menu-container">
                                <button
                                    className="widget-menu-btn"
                                    onClick={() => setShowWidgetMenu(!showWidgetMenu)}
                                >
                                    ⚙️ Widgets
                                </button>
                                {showWidgetMenu && (
                                    <div className="widget-menu">
                                        <div className="widget-menu-title">Toggle Widgets</div>
                                        {Object.entries(widgets).map(([key, enabled]) => (
                                            <label key={key} className="widget-toggle">
                                                <input
                                                    type="checkbox"
                                                    checked={enabled}
                                                    onChange={() => toggleWidget(key as keyof WidgetConfig)}
                                                />
                                                <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {!apiConnected && (
                        <div className="alert-warning" style={{ marginBottom: '24px' }}>
                            ⚠️ Bot API not connected - some data may be unavailable
                        </div>
                    )}

                    {/* Stats Grid */}
                    {widgets.stats && (
                        <div className="widget-container">
                            <div className="widget-header">
                                <span className="widget-title">📊 Statistics Overview</span>
                                <button className="widget-remove" onClick={() => toggleWidget('stats')}>×</button>
                            </div>
                            <div className="stat-grid">
                                {[
                                    { label: 'Total Cases', value: stats?.cases.total ?? '-', icon: '📋', color: 'stat-blue' },
                                    { label: 'Active Warns', value: stats?.cases.warns ?? '-', icon: '⚠️', color: 'stat-amber' },
                                    { label: 'Messages (30d)', value: stats?.activity.messages?.toLocaleString() ?? '-', icon: '💬', color: 'stat-purple' },
                                    { label: 'Staff Accounts', value: stats?.staff ?? '-', icon: '👥', color: 'stat-green' },
                                    { label: 'Open Tickets', value: stats?.tickets.open ?? '-', icon: '🎫', color: 'stat-red' },
                                    { label: 'Members', value: stats?.members?.toLocaleString() ?? '-', icon: '🏠', color: 'stat-indigo' },
                                ].map((stat, i) => (
                                    <div key={i} className="stat-card">
                                        <div className="stat-icon">{stat.icon}</div>
                                        <div className={`stat-value ${stat.color}`}>{stat.value}</div>
                                        <div className="stat-label">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Content Grid */}
                    <div className="content-grid">
                        {/* Recent Cases */}
                        {widgets.cases && (
                            <div className="widget-container">
                                <div className="widget-header">
                                    <span className="widget-title">📋 Recent Cases</span>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <Link href="/cases" className="card-link">View all →</Link>
                                        <button className="widget-remove" onClick={() => toggleWidget('cases')}>×</button>
                                    </div>
                                </div>
                                <div className="card" style={{ marginTop: 0 }}>
                                    {recentCases.length > 0 ? recentCases.slice(0, 5).map((c) => (
                                        <div key={c.case_id} className="case-item">
                                            <div className="case-left">
                                                <span className={`case-badge badge-${c.action_type}`}>
                                                    {c.action_type.toUpperCase()}
                                                </span>
                                                <div className="case-info">
                                                    <h4>{c.user_tag}</h4>
                                                    <p>{c.reason || 'No reason provided'}</p>
                                                </div>
                                            </div>
                                            <div className="case-right">
                                                <div className="case-id">{c.case_id}</div>
                                                <div className="case-date">{new Date(c.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="empty-state">
                                            {apiConnected ? 'No cases found' : 'Connect bot API to see cases'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        {widgets.actions && (
                            <div className="widget-container">
                                <div className="widget-header">
                                    <span className="widget-title">⚡ Quick Actions</span>
                                    <button className="widget-remove" onClick={() => toggleWidget('actions')}>×</button>
                                </div>
                                <div className="card" style={{ marginTop: 0 }}>
                                    <div className="action-grid">
                                        {[
                                            { label: 'User Lookup', desc: 'Search & view history', icon: '🔍', href: '/users' },
                                            { label: 'Cases', desc: 'Browse all cases', icon: '📋', href: '/cases' },
                                            { label: 'Analytics', desc: 'Growth & activity', icon: '📈', href: '/analytics' },
                                            { label: 'Appeals', desc: 'Review requests', icon: '⚖️', href: '/appeals' },
                                        ].map((action, i) => (
                                            <Link key={i} href={action.href} className="action-card">
                                                <div className="action-icon">{action.icon}</div>
                                                <div className="action-title">{action.label}</div>
                                                <div className="action-desc">{action.desc}</div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Services Status */}
                    {widgets.services && (
                        <div className="widget-container">
                            <div className="widget-header">
                                <span className="widget-title">🌐 Services Status</span>
                                <button className="widget-remove" onClick={() => toggleWidget('services')}>×</button>
                            </div>
                            <div className="card" style={{ marginTop: 0 }}>
                                <div className="status-grid">
                                    {[
                                        { name: 'CO Gov-Utils Bot', status: apiConnected },
                                        { name: 'Admin API', status: apiConnected },
                                        { name: 'Recording Server', url: 'https://recordings.usgrp.xyz', status: true },
                                        { name: 'Mail Server', url: 'https://mail.usgrp.xyz', status: true },
                                    ].map((service, i) => (
                                        <div key={i} className="status-item">
                                            <span className={`status-dot ${service.status ? 'status-online' : 'status-offline'}`} />
                                            <span className="status-name">{service.name}</span>
                                            {service.url && (
                                                <a href={service.url} target="_blank" className="status-link">→</a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
