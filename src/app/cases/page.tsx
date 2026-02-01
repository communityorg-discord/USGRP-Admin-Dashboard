'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSession } from '@/hooks/useSession';

interface Case {
    case_id: string;
    user_id: string;
    user_tag: string;
    action_type: string;
    reason: string;
    created_at: string;
    moderator_tag: string;
    status: string;
    duration?: string;
}

interface Appeal {
    id: string;
    discord_id: string;
    discord_username: string | null;
    email: string;
    appeal_type: string;
    ban_reason: string | null;
    appeal_message: string;
    evidence: string | null;
    status: 'pending' | 'under_review' | 'approved' | 'denied' | 'escalated';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    assigned_to: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    review_note: string | null;
    created_at: string;
    updated_at: string;
}

interface AppealStats {
    total: number;
    pending: number;
    under_review: number;
    approved: number;
    denied: number;
    escalated: number;
    avgResponseTime: number;
}

interface AppealMessage {
    id: number;
    sender_type: 'user' | 'staff' | 'system';
    sender_name: string | null;
    message: string;
    is_internal: boolean;
    created_at: string;
}

interface AppealHistory {
    id: number;
    action: string;
    old_value: string | null;
    new_value: string | null;
    performed_by: string | null;
    created_at: string;
}

type TabType = 'cases' | 'appeals';

const Icons = {
    Folder: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>,
    Scale: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v18M5 6l7-3 7 3M5 6v6a7 7 0 0 0 7 7 7 7 0 0 0 7-7V6" /></svg>,
    Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>,
    Filter: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>,
    Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>,
    X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
    Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>,
    Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    User: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    Mail: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
    Send: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
    ExternalLink: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>,
    History: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></svg>,
    Flag: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>,
    AlertTriangle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
    ArrowUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>,
    MessageSquare: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
    Eye: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
    Copy: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    under_review: { label: 'Under Review', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
    approved: { label: 'Approved', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
    denied: { label: 'Denied', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
    escalated: { label: 'Escalated', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    low: { label: 'Low', color: '#64748b' },
    normal: { label: 'Normal', color: '#3b82f6' },
    high: { label: 'High', color: '#f59e0b' },
    urgent: { label: 'Urgent', color: '#ef4444' },
};

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    warn: { label: 'WARN', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    mute: { label: 'MUTE', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
    kick: { label: 'KICK', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
    ban: { label: 'BAN', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
};

export default function CasesPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [activeTab, setActiveTab] = useState<TabType>('appeals');
    
    // Cases state
    const [cases, setCases] = useState<Case[]>([]);
    const [caseFilter, setCaseFilter] = useState('all');
    const [caseSearch, setCaseSearch] = useState('');
    const [loadingCases, setLoadingCases] = useState(false);
    
    // Appeals state
    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [appealStats, setAppealStats] = useState<AppealStats | null>(null);
    const [appealFilter, setAppealFilter] = useState('pending');
    const [appealSearch, setAppealSearch] = useState('');
    const [loadingAppeals, setLoadingAppeals] = useState(false);
    
    // Selected appeal
    const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
    const [appealMessages, setAppealMessages] = useState<AppealMessage[]>([]);
    const [appealHistory, setAppealHistory] = useState<AppealHistory[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);
    
    // Action modal
    const [actionModal, setActionModal] = useState<'approve' | 'deny' | 'escalate' | 'message' | null>(null);
    const [actionNote, setActionNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const loadCases = useCallback(async () => {
        setLoadingCases(true);
        try {
            const res = await fetch('/api/bot/cases');
            if (res.ok) {
                const data = await res.json();
                setCases(Array.isArray(data) ? data : []);
            }
        } catch (e) { console.error('Failed to load cases:', e); }
        setLoadingCases(false);
    }, []);

    const loadAppeals = useCallback(async () => {
        setLoadingAppeals(true);
        try {
            const params = new URLSearchParams();
            if (appealFilter !== 'all') params.set('status', appealFilter);
            if (appealSearch) params.set('search', appealSearch);
            
            const res = await fetch(`/api/appeals?${params}`);
            if (res.ok) {
                const data = await res.json();
                setAppeals(data.appeals || []);
                setAppealStats(data.stats || null);
            }
        } catch (e) { console.error('Failed to load appeals:', e); }
        setLoadingAppeals(false);
    }, [appealFilter, appealSearch]);

    const loadAppealDetail = async (id: string) => {
        setLoadingDetail(true);
        try {
            const res = await fetch(`/api/appeals/${id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedAppeal(data.appeal);
                setAppealMessages(data.messages || []);
                setAppealHistory(data.history || []);
            }
        } catch (e) { console.error('Failed to load appeal detail:', e); }
        setLoadingDetail(false);
    };

    useEffect(() => {
        if (session) {
            if (activeTab === 'cases') loadCases();
            else loadAppeals();
        }
    }, [session, activeTab, loadCases, loadAppeals]);

    const handleAppealAction = async (action: 'approve' | 'deny' | 'escalate' | 'under_review') => {
        if (!selectedAppeal) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/appeals/${selectedAppeal.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: action === 'approve' ? 'approved' : action === 'deny' ? 'denied' : action === 'escalate' ? 'escalated' : 'under_review',
                    review_note: actionNote || undefined,
                    message: actionNote || undefined,
                }),
            });
            if (res.ok) {
                await loadAppealDetail(selectedAppeal.id);
                await loadAppeals();
                setActionModal(null);
                setActionNote('');
            }
        } catch (e) { console.error('Action failed:', e); }
        setActionLoading(false);
    };

    const handleSendMessage = async () => {
        if (!selectedAppeal || !actionNote.trim()) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/appeals/${selectedAppeal.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: actionNote }),
            });
            if (res.ok) {
                await loadAppealDetail(selectedAppeal.id);
                setActionModal(null);
                setActionNote('');
            }
        } catch (e) { console.error('Send message failed:', e); }
        setActionLoading(false);
    };

    const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

    const formatTimeAgo = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const secs = Math.floor((now.getTime() - d.getTime()) / 1000);
        if (secs < 60) return 'just now';
        if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
        if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
        if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
        return d.toLocaleDateString();
    };

    if (sessionLoading) {
        return <div className="admin-layout"><div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Loading...</span></div></div>;
    }

    const filteredCases = cases.filter(c => {
        if (caseFilter !== 'all' && c.action_type !== caseFilter) return false;
        if (caseSearch && !c.user_tag?.toLowerCase().includes(caseSearch.toLowerCase()) && !c.case_id?.toLowerCase().includes(caseSearch.toLowerCase())) return false;
        return true;
    });

    const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
        { id: 'appeals', label: 'Appeals', icon: <Icons.Scale />, count: appealStats?.pending || 0 },
        { id: 'cases', label: 'Cases', icon: <Icons.Folder />, count: cases.length },
    ];

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div>
                    {/* Header */}
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">Moderation</h1>
                            <p className="page-subtitle">Manage cases and review appeals</p>
                        </div>
                        <div className="header-actions">
                            <button className="btn-secondary" onClick={() => activeTab === 'appeals' ? loadAppeals() : loadCases()}>
                                <Icons.Refresh /> Refresh
                            </button>
                            <a href="https://appeals.usgrp.xyz" target="_blank" className="btn-secondary">
                                <Icons.ExternalLink /> Public Appeals
                            </a>
                        </div>
                    </div>

                    {/* Stats */}
                    {activeTab === 'appeals' && appealStats && (
                        <div className="stats-row">
                            <div className="stat-card pending" onClick={() => setAppealFilter('pending')}>
                                <span className="stat-value">{appealStats.pending}</span>
                                <span className="stat-label">Pending</span>
                            </div>
                            <div className="stat-card review" onClick={() => setAppealFilter('under_review')}>
                                <span className="stat-value">{appealStats.under_review}</span>
                                <span className="stat-label">Under Review</span>
                            </div>
                            <div className="stat-card approved" onClick={() => setAppealFilter('approved')}>
                                <span className="stat-value">{appealStats.approved}</span>
                                <span className="stat-label">Approved</span>
                            </div>
                            <div className="stat-card denied" onClick={() => setAppealFilter('denied')}>
                                <span className="stat-value">{appealStats.denied}</span>
                                <span className="stat-label">Denied</span>
                            </div>
                            <div className="stat-card info">
                                <span className="stat-value">{appealStats.avgResponseTime ? `${appealStats.avgResponseTime.toFixed(1)}h` : 'N/A'}</span>
                                <span className="stat-label">Avg Response</span>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="tabs-container">
                        {tabs.map(tab => (
                            <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                                <span className="tab-icon">{tab.icon}</span>
                                {tab.label}
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className={`tab-badge ${tab.id === 'appeals' ? 'warning' : ''}`}>{tab.count}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="content-layout">
                        {/* Appeals Tab */}
                        {activeTab === 'appeals' && (
                            <>
                                <div className="list-panel">
                                    {/* Filters */}
                                    <div className="panel-header">
                                        <div className="search-box">
                                            <Icons.Search />
                                            <input type="text" placeholder="Search appeals..." value={appealSearch} onChange={e => setAppealSearch(e.target.value)} />
                                        </div>
                                        <div className="filter-tabs">
                                            {['pending', 'under_review', 'approved', 'denied', 'all'].map(f => (
                                                <button key={f} className={`filter-tab ${appealFilter === f ? 'active' : ''}`} onClick={() => setAppealFilter(f)}>
                                                    {f === 'all' ? 'All' : f === 'under_review' ? 'Review' : f.charAt(0).toUpperCase() + f.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* List */}
                                    {loadingAppeals ? (
                                        <div className="loading-state">Loading appeals...</div>
                                    ) : appeals.length > 0 ? (
                                        <div className="appeals-list">
                                            {appeals.map(appeal => {
                                                const status = STATUS_CONFIG[appeal.status] || STATUS_CONFIG.pending;
                                                const priority = PRIORITY_CONFIG[appeal.priority] || PRIORITY_CONFIG.normal;
                                                const isSelected = selectedAppeal?.id === appeal.id;
                                                return (
                                                    <div key={appeal.id} className={`appeal-row ${isSelected ? 'selected' : ''}`} onClick={() => loadAppealDetail(appeal.id)}>
                                                        <div className="appeal-left">
                                                            <div className="appeal-id">
                                                                <code>{appeal.id}</code>
                                                                {appeal.priority === 'urgent' && <span className="urgent-badge">!</span>}
                                                            </div>
                                                            <div className="appeal-user">
                                                                <span className="discord-id">{appeal.discord_username || appeal.discord_id}</span>
                                                                <span className="appeal-type">{appeal.appeal_type} appeal</span>
                                                            </div>
                                                        </div>
                                                        <div className="appeal-right">
                                                            <span className="appeal-status" style={{ background: status.bg, color: status.color }}>{status.label}</span>
                                                            <span className="appeal-time">{formatTimeAgo(appeal.created_at)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="empty-state">
                                            <Icons.Scale />
                                            <p>No appeals found</p>
                                            <span>Appeals will appear here when submitted</span>
                                        </div>
                                    )}
                                </div>

                                {/* Detail Panel */}
                                {selectedAppeal ? (
                                    <div className="detail-panel">
                                        {loadingDetail ? (
                                            <div className="loading-state">Loading details...</div>
                                        ) : (
                                            <>
                                                <div className="detail-header">
                                                    <div className="detail-title">
                                                        <h2>{selectedAppeal.id}</h2>
                                                        <span className="status-badge" style={{ background: STATUS_CONFIG[selectedAppeal.status]?.bg, color: STATUS_CONFIG[selectedAppeal.status]?.color }}>
                                                            {STATUS_CONFIG[selectedAppeal.status]?.label}
                                                        </span>
                                                    </div>
                                                    <button className="close-btn" onClick={() => setSelectedAppeal(null)}><Icons.X /></button>
                                                </div>

                                                {/* Quick Actions */}
                                                {selectedAppeal.status === 'pending' || selectedAppeal.status === 'under_review' ? (
                                                    <div className="quick-actions">
                                                        {selectedAppeal.status === 'pending' && (
                                                            <button className="action-btn review" onClick={() => handleAppealAction('under_review')}>
                                                                <Icons.Eye /> Claim
                                                            </button>
                                                        )}
                                                        <button className="action-btn approve" onClick={() => setActionModal('approve')}>
                                                            <Icons.Check /> Approve
                                                        </button>
                                                        <button className="action-btn deny" onClick={() => setActionModal('deny')}>
                                                            <Icons.X /> Deny
                                                        </button>
                                                        <button className="action-btn escalate" onClick={() => setActionModal('escalate')}>
                                                            <Icons.ArrowUp /> Escalate
                                                        </button>
                                                    </div>
                                                ) : null}

                                                {/* User Info */}
                                                <div className="detail-section">
                                                    <h4>Appellant</h4>
                                                    <div className="info-grid">
                                                        <div className="info-item">
                                                            <Icons.User />
                                                            <div>
                                                                <span className="label">Discord</span>
                                                                <span className="value">{selectedAppeal.discord_username || 'Unknown'}</span>
                                                            </div>
                                                            <button className="copy-btn" onClick={() => copyToClipboard(selectedAppeal.discord_id)}><Icons.Copy /></button>
                                                        </div>
                                                        <div className="info-item">
                                                            <Icons.Mail />
                                                            <div>
                                                                <span className="label">Email</span>
                                                                <span className="value">{selectedAppeal.email}</span>
                                                            </div>
                                                        </div>
                                                        <div className="info-item">
                                                            <Icons.Clock />
                                                            <div>
                                                                <span className="label">Submitted</span>
                                                                <span className="value">{new Date(selectedAppeal.created_at).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Appeal Content */}
                                                <div className="detail-section">
                                                    <h4>Appeal</h4>
                                                    <div className="appeal-type-badge" style={{ background: ACTION_CONFIG[selectedAppeal.appeal_type]?.bg || 'rgba(100,100,100,0.1)', color: ACTION_CONFIG[selectedAppeal.appeal_type]?.color || '#888' }}>
                                                        {selectedAppeal.appeal_type.toUpperCase()} APPEAL
                                                    </div>
                                                    {selectedAppeal.ban_reason && (
                                                        <div className="quoted-text">
                                                            <span className="quote-label">Punishment reason given:</span>
                                                            <p>{selectedAppeal.ban_reason}</p>
                                                        </div>
                                                    )}
                                                    <div className="appeal-message">
                                                        <p>{selectedAppeal.appeal_message}</p>
                                                    </div>
                                                    {selectedAppeal.evidence && (
                                                        <div className="evidence-box">
                                                            <span className="evidence-label">Evidence provided:</span>
                                                            <p>{selectedAppeal.evidence}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Messages */}
                                                {appealMessages.length > 0 && (
                                                    <div className="detail-section">
                                                        <h4>Correspondence</h4>
                                                        <div className="messages-list">
                                                            {appealMessages.map(msg => (
                                                                <div key={msg.id} className={`message ${msg.sender_type} ${msg.is_internal ? 'internal' : ''}`}>
                                                                    <div className="message-header">
                                                                        <span className="sender">{msg.sender_name || msg.sender_type}</span>
                                                                        <span className="time">{formatTimeAgo(msg.created_at)}</span>
                                                                        {msg.is_internal && <span className="internal-badge">Internal</span>}
                                                                    </div>
                                                                    <p>{msg.message}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <button className="add-message-btn" onClick={() => setActionModal('message')}>
                                                            <Icons.MessageSquare /> Add Message
                                                        </button>
                                                    </div>
                                                )}

                                                {/* History */}
                                                {appealHistory.length > 0 && (
                                                    <div className="detail-section">
                                                        <h4>History</h4>
                                                        <div className="history-list">
                                                            {appealHistory.slice(0, 10).map(h => (
                                                                <div key={h.id} className="history-item">
                                                                    <span className="history-action">{h.action.replace(/_/g, ' ')}</span>
                                                                    {h.new_value && <span className="history-value">{h.old_value} → {h.new_value}</span>}
                                                                    <span className="history-meta">{h.performed_by || 'System'} • {formatTimeAgo(h.created_at)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="detail-panel empty">
                                        <Icons.Scale />
                                        <p>Select an appeal to view details</p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Cases Tab */}
                        {activeTab === 'cases' && (
                            <div className="cases-panel">
                                <div className="panel-header">
                                    <div className="search-box">
                                        <Icons.Search />
                                        <input type="text" placeholder="Search cases..." value={caseSearch} onChange={e => setCaseSearch(e.target.value)} />
                                    </div>
                                    <div className="filter-tabs">
                                        {['all', 'warn', 'mute', 'kick', 'ban'].map(f => (
                                            <button key={f} className={`filter-tab ${caseFilter === f ? 'active' : ''}`} onClick={() => setCaseFilter(f)}>
                                                {f.charAt(0).toUpperCase() + f.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {loadingCases ? (
                                    <div className="loading-state">Loading cases...</div>
                                ) : filteredCases.length > 0 ? (
                                    <div className="cases-table">
                                        <div className="table-header">
                                            <span>Case</span>
                                            <span>User</span>
                                            <span>Action</span>
                                            <span>Reason</span>
                                            <span>Moderator</span>
                                            <span>Date</span>
                                        </div>
                                        {filteredCases.map(c => {
                                            const action = ACTION_CONFIG[c.action_type] || { label: c.action_type, color: '#888', bg: 'rgba(100,100,100,0.1)' };
                                            return (
                                                <div key={c.case_id} className="table-row">
                                                    <span className="case-id"><code>{c.case_id}</code></span>
                                                    <span className="user-tag">{c.user_tag || c.user_id}</span>
                                                    <span><span className="action-badge" style={{ background: action.bg, color: action.color }}>{action.label}</span></span>
                                                    <span className="reason">{c.reason || 'No reason'}</span>
                                                    <span className="mod-tag">{c.moderator_tag}</span>
                                                    <span className="date">{formatTimeAgo(c.created_at)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="empty-state full">
                                        <Icons.Folder />
                                        <p>No cases found</p>
                                        <span>Cases from moderation actions will appear here</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Action Modal */}
            {actionModal && (
                <div className="modal-overlay" onClick={() => { setActionModal(null); setActionNote(''); }}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{actionModal === 'approve' ? 'Approve Appeal' : actionModal === 'deny' ? 'Deny Appeal' : actionModal === 'escalate' ? 'Escalate Appeal' : 'Send Message'}</h3>
                            <button className="modal-close" onClick={() => { setActionModal(null); setActionNote(''); }}><Icons.X /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>{actionModal === 'message' ? 'Message' : 'Note (optional)'}</label>
                                <textarea value={actionNote} onChange={e => setActionNote(e.target.value)} placeholder={actionModal === 'approve' ? 'Reason for approval...' : actionModal === 'deny' ? 'Reason for denial...' : actionModal === 'escalate' ? 'Why is this being escalated?' : 'Type your message...'} rows={4} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => { setActionModal(null); setActionNote(''); }}>Cancel</button>
                            <button className={`btn-primary ${actionModal}`} onClick={actionModal === 'message' ? handleSendMessage : () => handleAppealAction(actionModal as any)} disabled={actionLoading}>
                                {actionLoading ? 'Processing...' : actionModal === 'message' ? 'Send Message' : actionModal === 'approve' ? 'Approve' : actionModal === 'deny' ? 'Deny' : 'Escalate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
                .page-title { font-size: 28px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
                .page-subtitle { font-size: 15px; color: var(--text-muted); }
                .header-actions { display: flex; gap: 12px; }
                
                .btn-secondary { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-secondary); font-size: 14px; font-weight: 500; cursor: pointer; text-decoration: none; transition: all 0.15s; }
                .btn-secondary:hover { background: var(--bg-hover); border-color: var(--border-hover); }
                .btn-secondary :global(svg) { width: 16px; height: 16px; }

                .stats-row { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
                .stat-card { background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px 24px; cursor: pointer; transition: all 0.15s; display: flex; flex-direction: column; gap: 4px; min-width: 100px; }
                .stat-card:hover { border-color: var(--border-hover); transform: translateY(-2px); }
                .stat-card.pending { border-left: 3px solid #f59e0b; }
                .stat-card.review { border-left: 3px solid #3b82f6; }
                .stat-card.approved { border-left: 3px solid #10b981; }
                .stat-card.denied { border-left: 3px solid #ef4444; }
                .stat-card.info { border-left: 3px solid #8b5cf6; }
                .stat-value { font-size: 24px; font-weight: 700; color: var(--text-primary); }
                .stat-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

                .tabs-container { display: flex; gap: 8px; margin-bottom: 24px; }
                .tab-btn { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: transparent; border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-secondary); font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
                .tab-btn:hover { background: var(--bg-hover); }
                .tab-btn.active { background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3); color: #60a5fa; }
                .tab-icon { width: 16px; height: 16px; display: flex; }
                .tab-icon :global(svg) { width: 100%; height: 100%; }
                .tab-badge { background: rgba(255, 255, 255, 0.1); padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; }
                .tab-badge.warning { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }

                .content-layout { display: grid; grid-template-columns: 1fr 1.2fr; gap: 24px; min-height: 500px; }

                .list-panel, .detail-panel, .cases-panel { background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
                .cases-panel { grid-column: span 2; }

                .panel-header { padding: 16px; border-bottom: 1px solid var(--border-subtle); display: flex; gap: 12px; flex-wrap: wrap; }
                .search-box { display: flex; align-items: center; gap: 10px; background: var(--bg-hover); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 8px 12px; flex: 1; min-width: 200px; }
                .search-box :global(svg) { width: 16px; height: 16px; color: var(--text-muted); flex-shrink: 0; }
                .search-box input { flex: 1; background: transparent; border: none; color: var(--text-primary); font-size: 14px; outline: none; }
                .filter-tabs { display: flex; gap: 4px; }
                .filter-tab { padding: 6px 12px; background: transparent; border: 1px solid transparent; border-radius: 6px; font-size: 12px; color: var(--text-muted); cursor: pointer; transition: all 0.15s; }
                .filter-tab:hover { background: var(--bg-hover); }
                .filter-tab.active { background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3); color: #60a5fa; }

                .appeals-list { flex: 1; overflow-y: auto; }
                .appeal-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--border-subtle); cursor: pointer; transition: background 0.1s; }
                .appeal-row:hover { background: var(--bg-hover); }
                .appeal-row.selected { background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; }
                .appeal-left { display: flex; flex-direction: column; gap: 4px; }
                .appeal-id { display: flex; align-items: center; gap: 8px; }
                .appeal-id code { font-size: 12px; color: #60a5fa; background: rgba(59, 130, 246, 0.1); padding: 2px 6px; border-radius: 4px; }
                .urgent-badge { width: 18px; height: 18px; background: #ef4444; color: white; border-radius: 50%; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
                .appeal-user { display: flex; align-items: center; gap: 8px; }
                .discord-id { font-size: 14px; color: var(--text-primary); font-weight: 500; }
                .appeal-type { font-size: 12px; color: var(--text-muted); }
                .appeal-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
                .appeal-status { font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
                .appeal-time { font-size: 11px; color: var(--text-dim); }

                .detail-panel { display: flex; flex-direction: column; }
                .detail-panel.empty { align-items: center; justify-content: center; color: var(--text-muted); }
                .detail-panel.empty :global(svg) { width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.3; }
                .detail-panel.empty p { font-size: 15px; margin: 0; }

                .detail-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid var(--border-subtle); }
                .detail-title { display: flex; align-items: center; gap: 12px; }
                .detail-title h2 { font-size: 18px; font-weight: 600; color: var(--text-primary); margin: 0; }
                .status-badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; }
                .close-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: var(--text-muted); cursor: pointer; border-radius: 6px; }
                .close-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
                .close-btn :global(svg) { width: 18px; height: 18px; }

                .quick-actions { display: flex; gap: 8px; padding: 12px 16px; border-bottom: 1px solid var(--border-subtle); background: var(--bg-hover); }
                .action-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid; transition: all 0.15s; }
                .action-btn :global(svg) { width: 14px; height: 14px; }
                .action-btn.review { background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3); color: #60a5fa; }
                .action-btn.approve { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); color: #10b981; }
                .action-btn.deny { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #ef4444; }
                .action-btn.escalate { background: rgba(139, 92, 246, 0.1); border-color: rgba(139, 92, 246, 0.3); color: #8b5cf6; }
                .action-btn:hover { transform: translateY(-1px); }

                .detail-section { padding: 16px; border-bottom: 1px solid var(--border-subtle); }
                .detail-section:last-child { border-bottom: none; }
                .detail-section h4 { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px 0; }

                .info-grid { display: flex; flex-direction: column; gap: 12px; }
                .info-item { display: flex; align-items: center; gap: 12px; padding: 10px; background: var(--bg-hover); border-radius: 8px; }
                .info-item :global(svg) { width: 18px; height: 18px; color: var(--text-muted); flex-shrink: 0; }
                .info-item div { display: flex; flex-direction: column; gap: 2px; flex: 1; }
                .info-item .label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; }
                .info-item .value { font-size: 13px; color: var(--text-primary); }
                .copy-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: var(--text-muted); cursor: pointer; border-radius: 4px; }
                .copy-btn:hover { background: var(--bg-surface); color: var(--text-primary); }
                .copy-btn :global(svg) { width: 14px; height: 14px; }

                .appeal-type-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; margin-bottom: 12px; }
                .quoted-text { background: var(--bg-hover); border-left: 3px solid var(--border-hover); padding: 12px; border-radius: 0 6px 6px 0; margin-bottom: 12px; }
                .quote-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 6px; }
                .quoted-text p { font-size: 13px; color: var(--text-secondary); margin: 0; font-style: italic; }
                .appeal-message { background: var(--bg-hover); padding: 16px; border-radius: 8px; }
                .appeal-message p { font-size: 14px; color: var(--text-primary); margin: 0; line-height: 1.6; white-space: pre-wrap; }
                .evidence-box { margin-top: 12px; padding: 12px; background: rgba(59, 130, 246, 0.05); border: 1px solid rgba(59, 130, 246, 0.1); border-radius: 8px; }
                .evidence-label { font-size: 11px; color: #60a5fa; text-transform: uppercase; display: block; margin-bottom: 6px; }
                .evidence-box p { font-size: 13px; color: var(--text-secondary); margin: 0; }

                .messages-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
                .message { padding: 12px; background: var(--bg-hover); border-radius: 8px; }
                .message.staff { background: rgba(59, 130, 246, 0.08); border-left: 3px solid #3b82f6; }
                .message.internal { opacity: 0.7; }
                .message-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
                .message .sender { font-size: 12px; font-weight: 600; color: var(--text-primary); }
                .message .time { font-size: 11px; color: var(--text-muted); }
                .internal-badge { font-size: 10px; background: rgba(139, 92, 246, 0.2); color: #8b5cf6; padding: 2px 6px; border-radius: 4px; }
                .message p { font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.5; }
                .add-message-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 10px; background: transparent; border: 1px dashed var(--border-subtle); border-radius: 8px; color: var(--text-muted); font-size: 13px; cursor: pointer; transition: all 0.15s; }
                .add-message-btn:hover { border-color: var(--border-hover); color: var(--text-primary); background: var(--bg-hover); }
                .add-message-btn :global(svg) { width: 14px; height: 14px; }

                .history-list { display: flex; flex-direction: column; gap: 8px; }
                .history-item { display: flex; flex-direction: column; gap: 2px; padding: 8px 0; border-bottom: 1px solid var(--border-subtle); }
                .history-item:last-child { border-bottom: none; }
                .history-action { font-size: 12px; font-weight: 500; color: var(--text-primary); text-transform: capitalize; }
                .history-value { font-size: 12px; color: var(--text-secondary); }
                .history-meta { font-size: 11px; color: var(--text-dim); }

                .cases-table { flex: 1; overflow-y: auto; }
                .table-header, .table-row { display: grid; grid-template-columns: 100px 1.5fr 80px 2fr 1fr 100px; gap: 16px; padding: 12px 16px; align-items: center; }
                .table-header { background: var(--bg-hover); font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; position: sticky; top: 0; }
                .table-row { border-bottom: 1px solid var(--border-subtle); }
                .table-row:hover { background: var(--bg-hover); }
                .case-id code { font-size: 11px; color: #60a5fa; }
                .user-tag { font-size: 13px; color: var(--text-primary); font-weight: 500; }
                .action-badge { font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 4px; }
                .reason { font-size: 13px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .mod-tag { font-size: 12px; color: var(--text-muted); }
                .date { font-size: 12px; color: var(--text-dim); }

                .loading-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; color: var(--text-muted); }
                .empty-state :global(svg) { width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.3; }
                .empty-state p { font-size: 15px; margin: 0 0 4px 0; color: var(--text-secondary); }
                .empty-state span { font-size: 13px; }
                .empty-state.full { min-height: 400px; }

                .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 16px; width: 100%; max-width: 480px; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border-subtle); }
                .modal-header h3 { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0; }
                .modal-close { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: var(--text-muted); cursor: pointer; border-radius: 6px; }
                .modal-close:hover { background: var(--bg-hover); }
                .modal-close :global(svg) { width: 18px; height: 18px; }
                .modal-body { padding: 20px; }
                .form-group label { display: block; font-size: 13px; font-weight: 500; color: var(--text-muted); margin-bottom: 8px; }
                .form-group textarea { width: 100%; padding: 12px; background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-size: 14px; resize: none; }
                .form-group textarea:focus { outline: none; border-color: #3b82f6; }
                .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 20px; border-top: 1px solid var(--border-subtle); }
                .btn-primary { padding: 10px 20px; background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; border-radius: 8px; color: white; font-size: 14px; font-weight: 600; cursor: pointer; }
                .btn-primary.approve { background: linear-gradient(135deg, #10b981, #059669); }
                .btn-primary.deny { background: linear-gradient(135deg, #ef4444, #dc2626); }
                .btn-primary.escalate { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
                .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

                @media (max-width: 1100px) { .content-layout { grid-template-columns: 1fr; } .cases-panel { grid-column: span 1; } .detail-panel { display: none; } .detail-panel:not(.empty) { display: flex; position: fixed; inset: 0; z-index: 100; background: var(--bg-surface); border-radius: 0; } }
            `}</style>
        </div>
    );
}
