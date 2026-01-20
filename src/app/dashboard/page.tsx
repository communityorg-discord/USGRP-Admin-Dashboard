'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';

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
    activity: boolean;
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
        activity: true,
    });
    const [showWidgetMenu, setShowWidgetMenu] = useState(false);

    // Modal states
    const [showCreateCase, setShowCreateCase] = useState(false);
    const [caseForm, setCaseForm] = useState({
        userId: '',
        actionType: 'warn',
        reason: '',
        duration: '',
        evidence: '',
    });
    const [caseSubmitting, setCaseSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('dashboard-widgets');
        if (saved) {
            try { setWidgets(JSON.parse(saved)); } catch { }
        }
    }, []);

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

    const handleCreateCase = async (e: React.FormEvent) => {
        e.preventDefault();
        setCaseSubmitting(true);

        try {
            const res = await fetch('/api/bot/cases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...caseForm,
                    moderatorId: session?.discordId
                }),
            });

            if (res.ok) {
                setToast({ type: 'success', message: 'Case created successfully' });
                setShowCreateCase(false);
                setCaseForm({ userId: '', actionType: 'warn', reason: '', duration: '', evidence: '' });
                // Refresh cases
                const casesRes = await fetch('/api/bot/cases');
                if (casesRes.ok) setRecentCases(await casesRes.json());
            } else {
                setToast({ type: 'error', message: 'Failed to create case' });
            }
        } catch {
            setToast({ type: 'error', message: 'Connection error' });
        } finally {
            setCaseSubmitting(false);
        }
    };

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

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

    const formatDate = () => currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formatTime = () => currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const getUserName = () => session?.displayName || session?.email?.split('@')[0] || 'Admin';

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={handleLogout} />

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
                            <button className="quick-action-btn" onClick={() => setShowCreateCase(true)}>
                                ➕ Create Case
                            </button>
                            <div className="widget-menu-container">
                                <button className="widget-menu-btn" onClick={() => setShowWidgetMenu(!showWidgetMenu)}>
                                    ⚙️ Widgets
                                </button>
                                {showWidgetMenu && (
                                    <div className="widget-menu">
                                        <div className="widget-menu-title">Toggle Widgets</div>
                                        {Object.entries(widgets).map(([key, enabled]) => (
                                            <label key={key} className="widget-toggle">
                                                <input type="checkbox" checked={enabled} onChange={() => toggleWidget(key as keyof WidgetConfig)} />
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
                                                <span className={`case-badge badge-${c.action_type}`}>{c.action_type.toUpperCase()}</span>
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
                                        <div className="empty-state">{apiConnected ? 'No cases found' : 'Connect bot API to see cases'}</div>
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
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                                        <button className="quick-action-btn warn" onClick={() => { setCaseForm(f => ({ ...f, actionType: 'warn' })); setShowCreateCase(true); }}>⚠️ Warn</button>
                                        <button className="quick-action-btn mute" onClick={() => { setCaseForm(f => ({ ...f, actionType: 'mute' })); setShowCreateCase(true); }}>🔇 Mute</button>
                                        <button className="quick-action-btn kick" onClick={() => { setCaseForm(f => ({ ...f, actionType: 'kick' })); setShowCreateCase(true); }}>👢 Kick</button>
                                        <button className="quick-action-btn ban" onClick={() => { setCaseForm(f => ({ ...f, actionType: 'ban' })); setShowCreateCase(true); }}>🔨 Ban</button>
                                    </div>
                                    <div className="action-grid">
                                        {[
                                            { label: 'User Lookup', desc: 'Search & view history', icon: '🔍', href: '/users' },
                                            { label: 'Tickets', desc: 'Open tickets', icon: '🎫', href: '/tickets' },
                                            { label: 'Government', desc: 'Officials list', icon: '🏛️', href: '/government' },
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

                    {/* Activity Feed */}
                    {widgets.activity && (
                        <div className="widget-container">
                            <div className="widget-header">
                                <span className="widget-title">📡 Recent Activity</span>
                                <button className="widget-remove" onClick={() => toggleWidget('activity')}>×</button>
                            </div>
                            <div className="card" style={{ marginTop: 0 }}>
                                <div className="activity-feed">
                                    {recentCases.slice(0, 8).map((c, i) => (
                                        <div key={i} className="activity-item">
                                            <div className={`activity-icon ${c.action_type}`}>
                                                {c.action_type === 'warn' ? '⚠️' : c.action_type === 'mute' ? '🔇' : c.action_type === 'kick' ? '👢' : c.action_type === 'ban' ? '🔨' : '📝'}
                                            </div>
                                            <div className="activity-content">
                                                <div className="activity-text">
                                                    <strong>{c.moderator_tag}</strong> {c.action_type}ed <strong>{c.user_tag}</strong>
                                                </div>
                                                <div className="activity-time">{c.reason || 'No reason'} • {new Date(c.created_at).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {recentCases.length === 0 && <div className="empty-state">No recent activity</div>}
                                </div>
                            </div>
                        </div>
                    )}

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
                                            {service.url && <a href={service.url} target="_blank" className="status-link">→</a>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Create Case Modal */}
            <Modal isOpen={showCreateCase} onClose={() => setShowCreateCase(false)} title="Create Case" size="md">
                <form onSubmit={handleCreateCase}>
                    <div className="form-row">
                        <label className="form-label">User ID *</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Discord User ID"
                            value={caseForm.userId}
                            onChange={(e) => setCaseForm({ ...caseForm, userId: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label className="form-label">Action Type *</label>
                        <select
                            className="form-select"
                            value={caseForm.actionType}
                            onChange={(e) => setCaseForm({ ...caseForm, actionType: e.target.value })}
                        >
                            <option value="warn">Warning</option>
                            <option value="mute">Mute</option>
                            <option value="kick">Kick</option>
                            <option value="ban">Ban</option>
                            <option value="note">Note</option>
                        </select>
                    </div>
                    {(caseForm.actionType === 'mute' || caseForm.actionType === 'ban') && (
                        <div className="form-row">
                            <label className="form-label">Duration</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. 1d, 7d, 30d, permanent"
                                value={caseForm.duration}
                                onChange={(e) => setCaseForm({ ...caseForm, duration: e.target.value })}
                            />
                            <div className="form-hint">Leave empty for permanent</div>
                        </div>
                    )}
                    <div className="form-row">
                        <label className="form-label">Reason *</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Reason for this action..."
                            value={caseForm.reason}
                            onChange={(e) => setCaseForm({ ...caseForm, reason: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <label className="form-label">Evidence</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Links to screenshots, message IDs, etc."
                            value={caseForm.evidence}
                            onChange={(e) => setCaseForm({ ...caseForm, evidence: e.target.value })}
                            style={{ minHeight: '60px' }}
                        />
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowCreateCase(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={caseSubmitting}>
                            {caseSubmitting ? 'Creating...' : 'Create Case'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Toast Notifications */}
            {toast && (
                <div className="toast-container">
                    <div className={`toast ${toast.type}`}>
                        <span>{toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}</span>
                        <span className="toast-message">{toast.message}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
