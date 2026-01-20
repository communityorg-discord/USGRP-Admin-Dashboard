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

export default function DashboardPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentCases, setRecentCases] = useState<Case[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Modal state
    const [showCreateCase, setShowCreateCase] = useState(false);
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
        return <div className="admin-layout"><div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div></div>;
    }

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div style={{ maxWidth: '1400px', width: '100%' }}>
                    {/* Welcome Header */}
                    <div className="welcome-header">
                        <div className="welcome-text">
                            <h1>{getGreeting()}, {session?.displayName || session?.email?.split('@')[0] || 'Admin'}</h1>
                            <p>Welcome to the USGRP Admin Dashboard</p>
                        </div>
                        <div className="welcome-time">
                            <div className="time">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                            <div className="date">{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label"><span className="stat-icon">☰</span> Total Cases</div>
                            <div className="stat-value">{stats?.cases.total || 0}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label"><span className="stat-icon">⚠</span> Active Warnings</div>
                            <div className="stat-value">{stats?.cases.warns || 0}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label"><span className="stat-icon">◔</span> Messages (30d)</div>
                            <div className="stat-value">{stats?.activity.messages?.toLocaleString() || 0}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label"><span className="stat-icon">⊞</span> Staff Accounts</div>
                            <div className="stat-value">{stats?.staff || 0}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label"><span className="stat-icon">✉</span> Open Tickets</div>
                            <div className="stat-value">{stats?.tickets.open || 0}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label"><span className="stat-icon">⊕</span> Members</div>
                            <div className="stat-value">{stats?.members?.toLocaleString() || 0}</div>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="content-grid">
                        {/* Recent Cases */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Recent Cases</h3>
                                <button className="btn btn-primary" onClick={() => setShowCreateCase(true)}>New Case</button>
                            </div>
                            {recentCases.length > 0 ? recentCases.slice(0, 8).map((c) => (
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
                                <div className="empty-state">No recent cases</div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Quick Actions</h3>
                            </div>
                            <div style={{ padding: 'var(--spacing-lg)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <button className="quick-action-btn" onClick={() => { setCaseForm({ ...caseForm, actionType: 'warn' }); setShowCreateCase(true); }}>
                                    Warn User
                                </button>
                                <button className="quick-action-btn" onClick={() => { setCaseForm({ ...caseForm, actionType: 'mute' }); setShowCreateCase(true); }}>
                                    Mute User
                                </button>
                                <button className="quick-action-btn" onClick={() => { setCaseForm({ ...caseForm, actionType: 'kick' }); setShowCreateCase(true); }}>
                                    Kick User
                                </button>
                                <button className="quick-action-btn" onClick={() => { setCaseForm({ ...caseForm, actionType: 'ban' }); setShowCreateCase(true); }}>
                                    Ban User
                                </button>
                            </div>

                            <div className="card-header" style={{ marginTop: 'var(--spacing-md)' }}>
                                <h3 className="card-title">Navigation</h3>
                            </div>
                            <div style={{ padding: 'var(--spacing-lg)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <a href="/users" className="quick-action-btn" style={{ textAlign: 'center', textDecoration: 'none' }}>User Lookup</a>
                                <a href="/tickets" className="quick-action-btn" style={{ textAlign: 'center', textDecoration: 'none' }}>Tickets</a>
                                <a href="/government" className="quick-action-btn" style={{ textAlign: 'center', textDecoration: 'none' }}>Government</a>
                                <a href="/appeals" className="quick-action-btn" style={{ textAlign: 'center', textDecoration: 'none' }}>Appeals</a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Create Case Modal */}
            <Modal isOpen={showCreateCase} onClose={() => setShowCreateCase(false)} title="Create Case" size="md">
                <form onSubmit={handleCreateCase}>
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
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
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
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
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
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
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
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
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowCreateCase(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={caseSubmitting}>
                            {caseSubmitting ? 'Creating...' : 'Create Case'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
