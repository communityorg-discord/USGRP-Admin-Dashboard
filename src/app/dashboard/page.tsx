'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
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
    )
};

export default function DashboardPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentCases, setRecentCases] = useState<Case[]>([]);
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

    useEffect(() => {
        if (session) {
            fetch('/api/bot/stats').then(r => r.ok ? r.json() : null).then(d => d && setStats(d)).catch(() => { });
            fetch('/api/bot/cases').then(r => r.ok ? r.json() : []).then(setRecentCases).catch(() => { });
        }
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
