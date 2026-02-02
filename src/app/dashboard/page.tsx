'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import UserSearch from '@/components/UserSearch';
import { useSession } from '@/hooks/useSession';

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

interface SystemStatus {
    services: Array<{ name: string; status: string; memory: number; cpu: number; uptime: number; restarts: number }>;
    disk: { used: number; total: number; percent: number };
    memory: { used: number; total: number; percent: number };
    uptime: number;
}

interface EconomyStats {
    totalCitizens: number;
    totalWealth: number;
    avgWealth: number;
    topCitizens: Array<{ username: string; balance: number }>;
    recentTransactions: number;
    treasury: number;
}

// Icons
const Icons = {
    Warn: () => (
        <svg className="quick-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    Mute: () => (
        <svg className="quick-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
    ),
    Kick: () => (
        <svg className="quick-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="18" y1="8" x2="23" y2="13" />
            <line x1="23" y1="8" x2="18" y2="13" />
        </svg>
    ),
    Ban: () => (
        <svg className="quick-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
    ),
    UserLookup: () => (
        <svg className="quick-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    Tickets: () => (
        <svg className="quick-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
        </svg>
    ),
    Government: () => (
        <svg className="quick-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" />
            <path d="M5 21V7l7-4 7 4v14" />
            <path d="M9 21v-6h6v6" />
        </svg>
    ),
    Appeals: () => (
        <svg className="quick-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    ),
    Server: () => (
        <svg className="quick-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
    ),
    Dollar: () => (
        <svg className="quick-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    ),
    Refresh: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 16, height: 16 }}>
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
    ),
};

export default function DashboardPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentCases, setRecentCases] = useState<Case[]>([]);
    const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
    const [economyStats, setEconomyStats] = useState<EconomyStats | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Modal state
    const [showCreateCase, setShowCreateCase] = useState(false);
    const [showCaseDetails, setShowCaseDetails] = useState(false);
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    const [caseForm, setCaseForm] = useState({ userId: '', actionType: 'warn', reason: '', duration: '', evidence: '' });
    const [caseSubmitting, setCaseSubmitting] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchAllData = () => {
        if (session) {
            fetch('/api/bot/stats').then(r => r.ok ? r.json() : null).then(d => d && setStats(d)).catch(() => { });
            fetch('/api/bot/cases').then(r => r.ok ? r.json() : []).then(setRecentCases).catch(() => { });
            fetch('/api/system/status').then(r => r.ok ? r.json() : null).then(d => d && setSystemStatus(d)).catch(() => { });
            fetch('/api/economy/stats').then(r => r.ok ? r.json() : null).then(d => d && setEconomyStats(d)).catch(() => { });
        }
    };

    useEffect(() => {
        fetchAllData();
        // Refresh system status every 30 seconds
        const interval = setInterval(() => {
            fetch('/api/system/status').then(r => r.ok ? r.json() : null).then(d => d && setSystemStatus(d)).catch(() => { });
        }, 30000);
        return () => clearInterval(interval);
    }, [session]);

    const handleCaseClick = (c: Case) => {
        setSelectedCase(c);
        setShowCaseDetails(true);
    };

    const handleCreateCase = async (e: React.FormEvent) => {
        e.preventDefault();
        setCaseSubmitting(true);
        try {
            await fetch('/api/bot/cases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(caseForm),
            });
            setShowCreateCase(false);
            setCaseForm({ userId: '', actionType: 'warn', reason: '', duration: '', evidence: '' });
            fetch('/api/bot/cases').then(r => r.ok ? r.json() : []).then(setRecentCases).catch(() => { });
        } catch { }
        setCaseSubmitting(false);
    };

    if (sessionLoading) {
        return (
            <div className="admin-layout">
                <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Loading...</span>
                </div>
            </div>
        );
    }

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const formatNumber = (n: number | undefined) => {
        if (!n) return '0';
        return n.toLocaleString();
    };

    const formatMoney = (n: number | undefined) => {
        if (!n) return '$0';
        return '$' + n.toLocaleString();
    };

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return '#10b981';
            case 'stopped': return '#f59e0b';
            case 'errored': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const onlineCount = systemStatus?.services.filter(s => s.status === 'online').length || 0;
    const totalServices = systemStatus?.services.length || 0;

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div>
                    {/* Welcome Header */}
                    <header className="welcome-header">
                        <div className="welcome-text">
                            <h1>{getGreeting()}, {session?.displayName || session?.email?.split('@')[0] || 'Admin'}</h1>
                            <p>Welcome to the USGRP Admin Dashboard</p>
                        </div>
                        <div className="welcome-time">
                            <div className="time">
                                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="date">
                                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </div>
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <section className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label">
                                <span className="stat-icon">📋</span>
                                Total Cases
                            </div>
                            <div className="stat-value">{formatNumber(stats?.cases.total)}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">
                                <span className="stat-icon">⚠️</span>
                                Active Warnings
                            </div>
                            <div className="stat-value">{formatNumber(stats?.cases.warns)}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">
                                <span className="stat-icon">💬</span>
                                Messages (30d)
                            </div>
                            <div className="stat-value">{formatNumber(stats?.activity.messages)}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">
                                <span className="stat-icon">👥</span>
                                Staff
                            </div>
                            <div className="stat-value">{formatNumber(stats?.staff)}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">
                                <span className="stat-icon">📨</span>
                                Open Tickets
                            </div>
                            <div className="stat-value">{formatNumber(stats?.tickets.open)}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">
                                <span className="stat-icon">🌐</span>
                                Members
                            </div>
                            <div className="stat-value">{formatNumber(stats?.members)}</div>
                        </div>
                    </section>

                    {/* System Status Row */}
                    <section className="content-grid" style={{ marginBottom: '24px' }}>
                        {/* System Status */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">🖥️ System Status</h3>
                                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={fetchAllData}>
                                    <Icons.Refresh /> Refresh
                                </button>
                            </div>
                            {systemStatus ? (
                                <div style={{ padding: '16px' }}>
                                    {/* Services Overview */}
                                    <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: '120px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Services</div>
                                            <div style={{ fontSize: '18px', fontWeight: 600, color: onlineCount === totalServices ? '#10b981' : '#f59e0b' }}>
                                                {onlineCount}/{totalServices} Online
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, minWidth: '120px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Disk</div>
                                            <div style={{ fontSize: '18px', fontWeight: 600, color: systemStatus.disk.percent > 85 ? '#ef4444' : 'var(--text-primary)' }}>
                                                {systemStatus.disk.used}GB / {systemStatus.disk.total}GB
                                            </div>
                                            <div style={{ marginTop: '4px', height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${systemStatus.disk.percent}%`, background: systemStatus.disk.percent > 85 ? '#ef4444' : '#10b981', borderRadius: '2px' }} />
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, minWidth: '120px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Memory</div>
                                            <div style={{ fontSize: '18px', fontWeight: 600, color: systemStatus.memory.percent > 85 ? '#ef4444' : 'var(--text-primary)' }}>
                                                {systemStatus.memory.used}GB / {systemStatus.memory.total}GB
                                            </div>
                                            <div style={{ marginTop: '4px', height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${systemStatus.memory.percent}%`, background: systemStatus.memory.percent > 85 ? '#ef4444' : '#3b82f6', borderRadius: '2px' }} />
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, minWidth: '120px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Uptime</div>
                                            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {formatUptime(systemStatus.uptime)}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Services List */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                                        {systemStatus.services.slice(0, 12).map((s) => (
                                            <div key={s.name} style={{ padding: '10px', background: 'var(--bg-primary)', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(s.status), flexShrink: 0 }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{s.memory}MB • {s.restarts} restarts</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-state">Loading system status...</div>
                            )}
                        </div>

                        {/* Economy Overview */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">💰 Economy Overview</h3>
                            </div>
                            {economyStats ? (
                                <div style={{ padding: '16px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                        <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Citizens</div>
                                            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--accent-primary)' }}>{formatNumber(economyStats.totalCitizens)}</div>
                                        </div>
                                        <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Total Wealth</div>
                                            <div style={{ fontSize: '20px', fontWeight: 600, color: '#10b981' }}>{formatMoney(economyStats.totalWealth)}</div>
                                        </div>
                                        <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Avg Wealth</div>
                                            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>{formatMoney(economyStats.avgWealth)}</div>
                                        </div>
                                        <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Treasury</div>
                                            <div style={{ fontSize: '20px', fontWeight: 600, color: '#f59e0b' }}>{formatMoney(economyStats.treasury)}</div>
                                        </div>
                                    </div>
                                    {/* Top Citizens */}
                                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Top Citizens</div>
                                    {economyStats.topCitizens.map((c, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < economyStats.topCitizens.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: 600, color: i < 3 ? '#f59e0b' : 'var(--text-muted)', minWidth: '20px' }}>#{i + 1}</span>
                                                <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{c.username}</span>
                                            </div>
                                            <span style={{ fontSize: '13px', fontWeight: 500, color: '#10b981' }}>{formatMoney(c.balance)}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">Loading economy data...</div>
                            )}
                        </div>
                    </section>

                    {/* Content Grid */}
                    <section className="content-grid">
                        {/* Recent Cases */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Recent Cases</h3>
                                <button className="btn btn-primary" onClick={() => setShowCreateCase(true)}>
                                    New Case
                                </button>
                            </div>
                            {recentCases.length > 0 ? (
                                recentCases.slice(0, 8).map((c) => (
                                    <div key={c.case_id} className="case-item" onClick={() => handleCaseClick(c)}>
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
                                ))
                            ) : (
                                <div className="empty-state">No recent cases</div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Quick Actions</h3>
                            </div>
                            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <button className="quick-action-btn" onClick={() => { setCaseForm({ ...caseForm, actionType: 'warn' }); setShowCreateCase(true); }}>
                                    <Icons.Warn />
                                    Warn User
                                </button>
                                <button className="quick-action-btn" onClick={() => { setCaseForm({ ...caseForm, actionType: 'mute' }); setShowCreateCase(true); }}>
                                    <Icons.Mute />
                                    Mute User
                                </button>
                                <button className="quick-action-btn" onClick={() => { setCaseForm({ ...caseForm, actionType: 'kick' }); setShowCreateCase(true); }}>
                                    <Icons.Kick />
                                    Kick User
                                </button>
                                <button 
                                    className="quick-action-btn" 
                                    style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                    onClick={() => { setCaseForm({ ...caseForm, actionType: 'ban' }); setShowCreateCase(true); }}
                                >
                                    <Icons.Ban />
                                    Ban User
                                </button>
                            </div>

                            <div className="card-header" style={{ marginTop: '8px' }}>
                                <h3 className="card-title">🔍 Quick User Search</h3>
                            </div>
                            <div style={{ padding: '16px' }}>
                                <UserSearch 
                                    placeholder="Search by username or ID..."
                                    onSelect={(user) => window.location.href = `/users?id=${user.user_id}`}
                                />
                            </div>

                            <div className="card-header" style={{ marginTop: '8px' }}>
                                <h3 className="card-title">Navigation</h3>
                            </div>
                            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <a href="/users" className="quick-action-btn">
                                    <Icons.UserLookup />
                                    User Lookup
                                </a>
                                <a href="/tickets" className="quick-action-btn">
                                    <Icons.Tickets />
                                    Tickets
                                </a>
                                <a href="/government" className="quick-action-btn">
                                    <Icons.Government />
                                    Government
                                </a>
                                <a href="/appeals" className="quick-action-btn">
                                    <Icons.Appeals />
                                    Appeals
                                </a>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* Create Case Modal */}
            <Modal isOpen={showCreateCase} onClose={() => setShowCreateCase(false)} title="Create Case" size="md">
                <form onSubmit={handleCreateCase}>
                    <div style={{ marginBottom: '16px' }}>
                        <label className="form-label">User ID</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Discord User ID"
                            value={caseForm.userId}
                            onChange={e => setCaseForm({ ...caseForm, userId: e.target.value })}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label className="form-label">Action Type</label>
                        <select
                            className="form-input"
                            value={caseForm.actionType}
                            onChange={e => setCaseForm({ ...caseForm, actionType: e.target.value })}
                        >
                            <option value="warn">Warning</option>
                            <option value="mute">Mute</option>
                            <option value="kick">Kick</option>
                            <option value="ban">Ban</option>
                        </select>
                    </div>
                    {caseForm.actionType === 'mute' && (
                        <div style={{ marginBottom: '16px' }}>
                            <label className="form-label">Duration</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. 1h, 1d, 7d"
                                value={caseForm.duration}
                                onChange={e => setCaseForm({ ...caseForm, duration: e.target.value })}
                            />
                        </div>
                    )}
                    <div style={{ marginBottom: '24px' }}>
                        <label className="form-label">Reason</label>
                        <textarea
                            className="form-input"
                            placeholder="Reason for this action..."
                            rows={3}
                            value={caseForm.reason}
                            onChange={e => setCaseForm({ ...caseForm, reason: e.target.value })}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowCreateCase(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={caseSubmitting}>
                            {caseSubmitting ? 'Processing...' : 'Execute Action'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Case Details Modal */}
            <Modal isOpen={showCaseDetails} onClose={() => setShowCaseDetails(false)} title="Case Details" size="md">
                {selectedCase && (
                    <div>
                        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className={`case-badge badge-${selectedCase.action_type}`} style={{ fontSize: '12px', padding: '6px 14px' }}>
                                {selectedCase.action_type.toUpperCase()}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                {new Date(selectedCase.created_at).toLocaleString()}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>User</label>
                                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedCase.user_tag}</div>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Moderator</label>
                                <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--accent-blue)' }}>{selectedCase.moderator_tag}</div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Reason</label>
                                <div style={{ background: 'var(--bg-primary)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', lineHeight: '1.6', fontSize: '14px' }}>
                                    {selectedCase.reason || 'No reason provided.'}
                                </div>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Case ID</label>
                                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '13px' }}>{selectedCase.case_id}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowCaseDetails(false)}>Close</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
