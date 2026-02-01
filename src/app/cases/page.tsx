'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
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
}

interface Appeal {
    id: string;
    discord_id: string;
    discord_tag: string;
    email: string;
    appeal_type: string;
    reason: string;
    explanation: string;
    status: 'pending' | 'approved' | 'denied';
    created_at: string;
    reviewed_by?: string;
    reviewed_at?: string;
}

type TabType = 'cases' | 'appeals';

// Icons
const Icons = {
    Folder: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),
    Scale: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v18" />
            <path d="M5 6l7-3 7 3" />
            <path d="M5 6v6a7 7 0 0 0 7 7 7 7 0 0 0 7-7V6" />
        </svg>
    ),
};

export default function CasesPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [activeTab, setActiveTab] = useState<TabType>('cases');
    
    // Cases state
    const [cases, setCases] = useState<Case[]>([]);
    const [caseFilter, setCaseFilter] = useState<string>('all');
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);
    
    // Appeals state
    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [appealFilter, setAppealFilter] = useState<string>('pending');
    const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
    
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session) {
            loadData();
        }
    }, [session, activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'cases') {
                const res = await fetch('/api/bot/cases');
                if (res.ok) setCases(await res.json());
            } else {
                const res = await fetch('/api/appeals');
                if (res.ok) {
                    const data = await res.json();
                    setAppeals(data.appeals || []);
                }
            }
        } catch (e) {
            console.error('Failed to load data:', e);
        }
        setLoading(false);
    };

    const handleAppealAction = async (id: string, action: 'approve' | 'deny') => {
        try {
            const res = await fetch(`/api/appeals/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: action === 'approve' ? 'approved' : 'denied' })
            });
            if (res.ok) {
                loadData();
                setSelectedAppeal(null);
            }
        } catch (e) {
            console.error('Failed to update appeal:', e);
        }
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

    const filteredCases = caseFilter === 'all' ? cases : cases.filter(c => c.action_type === caseFilter);
    const filteredAppeals = appealFilter === 'all' ? appeals : appeals.filter(a => a.status === appealFilter);

    const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
        { id: 'cases', label: 'Cases', icon: <Icons.Folder />, count: cases.length },
        { id: 'appeals', label: 'Appeals', icon: <Icons.Scale />, count: appeals.filter(a => a.status === 'pending').length },
    ];

    const getBadgeClass = (type: string) => {
        switch (type) {
            case 'warn': return 'badge-warn';
            case 'mute': return 'badge-mute';
            case 'kick': return 'badge-kick';
            case 'ban': return 'badge-ban';
            default: return '';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return { class: 'badge-pending', text: 'Pending' };
            case 'approved': return { class: 'badge-approved', text: 'Approved' };
            case 'denied': return { class: 'badge-denied', text: 'Denied' };
            default: return { class: '', text: status };
        }
    };

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div>
                    {/* Header */}
                    <div className="page-header">
                        <h1 className="page-title">Moderation</h1>
                        <p className="page-subtitle">Manage cases and review appeals</p>
                    </div>

                    {/* Tabs */}
                    <div className="tabs-container">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className="tab-icon">{tab.icon}</span>
                                {tab.label}
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className="tab-count">{tab.count}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="tab-content">
                        {loading ? (
                            <div className="card">
                                <div className="empty-state">Loading...</div>
                            </div>
                        ) : (
                            <>
                                {/* Cases Tab */}
                                {activeTab === 'cases' && (
                                    <div className="card">
                                        <div className="card-header">
                                            <h3 className="card-title">All Cases</h3>
                                            <div className="filter-group">
                                                {['all', 'warn', 'mute', 'kick', 'ban'].map(f => (
                                                    <button
                                                        key={f}
                                                        className={`filter-btn ${caseFilter === f ? 'active' : ''}`}
                                                        onClick={() => setCaseFilter(f)}
                                                    >
                                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {filteredCases.length > 0 ? (
                                            <div className="cases-list">
                                                {filteredCases.map(c => (
                                                    <div 
                                                        key={c.case_id} 
                                                        className="case-row"
                                                        onClick={() => setSelectedCase(c)}
                                                    >
                                                        <span className={`case-badge ${getBadgeClass(c.action_type)}`}>
                                                            {c.action_type.toUpperCase()}
                                                        </span>
                                                        <div className="case-info">
                                                            <span className="case-user">{c.user_tag}</span>
                                                            <span className="case-reason">{c.reason || 'No reason'}</span>
                                                        </div>
                                                        <div className="case-meta">
                                                            <span className="case-id">{c.case_id}</span>
                                                            <span className="case-date">{new Date(c.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="empty-state">
                                                <p>No cases found</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Appeals Tab */}
                                {activeTab === 'appeals' && (
                                    <div className="card">
                                        <div className="card-header">
                                            <h3 className="card-title">Appeals</h3>
                                            <div className="filter-group">
                                                {['pending', 'approved', 'denied', 'all'].map(f => (
                                                    <button
                                                        key={f}
                                                        className={`filter-btn ${appealFilter === f ? 'active' : ''}`}
                                                        onClick={() => setAppealFilter(f)}
                                                    >
                                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {filteredAppeals.length > 0 ? (
                                            <div className="cases-list">
                                                {filteredAppeals.map(a => {
                                                    const status = getStatusBadge(a.status);
                                                    return (
                                                        <div 
                                                            key={a.id} 
                                                            className="case-row"
                                                            onClick={() => setSelectedAppeal(a)}
                                                        >
                                                            <span className={`case-badge ${status.class}`}>
                                                                {status.text}
                                                            </span>
                                                            <div className="case-info">
                                                                <span className="case-user">{a.discord_tag || a.discord_id}</span>
                                                                <span className="case-reason">{a.appeal_type} appeal</span>
                                                            </div>
                                                            <div className="case-meta">
                                                                <span className="case-date">{new Date(a.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="empty-state">
                                                <p>No appeals found</p>
                                                <span>Appeals submitted at usgrp.xyz/appeal will appear here</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>

            {/* Case Details Modal */}
            <Modal isOpen={!!selectedCase} onClose={() => setSelectedCase(null)} title="Case Details">
                {selectedCase && (
                    <div>
                        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className={`case-badge ${getBadgeClass(selectedCase.action_type)}`} style={{ fontSize: '12px', padding: '6px 14px' }}>
                                {selectedCase.action_type.toUpperCase()}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                {new Date(selectedCase.created_at).toLocaleString()}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div>
                                <label className="detail-label">User</label>
                                <div className="detail-value">{selectedCase.user_tag}</div>
                            </div>
                            
                            <div>
                                <label className="detail-label">Moderator</label>
                                <div className="detail-value" style={{ color: 'var(--accent-blue)' }}>{selectedCase.moderator_tag}</div>
                            </div>

                            <div>
                                <label className="detail-label">Reason</label>
                                <div className="detail-box">
                                    {selectedCase.reason || 'No reason provided.'}
                                </div>
                            </div>
                            
                            <div>
                                <label className="detail-label">Case ID</label>
                                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                    {selectedCase.case_id}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setSelectedCase(null)}>Close</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Appeal Details Modal */}
            <Modal isOpen={!!selectedAppeal} onClose={() => setSelectedAppeal(null)} title="Appeal Details">
                {selectedAppeal && (
                    <div>
                        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className={`case-badge ${getStatusBadge(selectedAppeal.status).class}`} style={{ fontSize: '12px', padding: '6px 14px' }}>
                                {getStatusBadge(selectedAppeal.status).text}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                {new Date(selectedAppeal.created_at).toLocaleString()}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div>
                                <label className="detail-label">Discord User</label>
                                <div className="detail-value">{selectedAppeal.discord_tag || selectedAppeal.discord_id}</div>
                            </div>
                            
                            <div>
                                <label className="detail-label">Email</label>
                                <div className="detail-value">{selectedAppeal.email}</div>
                            </div>

                            <div>
                                <label className="detail-label">Appeal Type</label>
                                <div className="detail-value" style={{ textTransform: 'capitalize' }}>{selectedAppeal.appeal_type}</div>
                            </div>

                            <div>
                                <label className="detail-label">Why they were punished</label>
                                <div className="detail-box">{selectedAppeal.reason}</div>
                            </div>

                            <div>
                                <label className="detail-label">Their explanation</label>
                                <div className="detail-box">{selectedAppeal.explanation}</div>
                            </div>
                        </div>

                        {selectedAppeal.status === 'pending' && (
                            <div style={{ marginTop: '28px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button 
                                    className="btn btn-secondary" 
                                    style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}
                                    onClick={() => handleAppealAction(selectedAppeal.id, 'deny')}
                                >
                                    Deny
                                </button>
                                <button 
                                    className="btn btn-primary" 
                                    style={{ background: '#10b981' }}
                                    onClick={() => handleAppealAction(selectedAppeal.id, 'approve')}
                                >
                                    Approve
                                </button>
                            </div>
                        )}

                        {selectedAppeal.status !== 'pending' && (
                            <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary" onClick={() => setSelectedAppeal(null)}>Close</button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <style jsx>{`
                .page-header {
                    margin-bottom: 32px;
                }

                .page-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                }

                .page-subtitle {
                    font-size: 15px;
                    color: var(--text-muted);
                }

                .tabs-container {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 24px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--border-subtle);
                }

                .tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    background: transparent;
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    color: var(--text-secondary);
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .tab-btn:hover {
                    background: var(--bg-hover);
                    border-color: var(--border-hover);
                    color: var(--text-primary);
                }

                .tab-btn.active {
                    background: rgba(59, 130, 246, 0.1);
                    border-color: rgba(59, 130, 246, 0.3);
                    color: #60a5fa;
                }

                .tab-icon {
                    width: 16px;
                    height: 16px;
                    display: flex;
                }

                .tab-icon :global(svg) {
                    width: 100%;
                    height: 100%;
                }

                .tab-count {
                    background: rgba(239, 68, 68, 0.15);
                    color: #f87171;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 10px;
                }

                .filter-group {
                    display: flex;
                    gap: 4px;
                }

                .filter-btn {
                    padding: 6px 12px;
                    background: transparent;
                    border: 1px solid var(--border-subtle);
                    border-radius: 6px;
                    color: var(--text-muted);
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .filter-btn:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }

                .filter-btn.active {
                    background: var(--accent-blue);
                    border-color: var(--accent-blue);
                    color: white;
                }

                .cases-list {
                    display: flex;
                    flex-direction: column;
                }

                .case-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 24px;
                    border-bottom: 1px solid var(--border-subtle);
                    cursor: pointer;
                    transition: background 0.1s;
                }

                .case-row:last-child {
                    border-bottom: none;
                }

                .case-row:hover {
                    background: var(--bg-hover);
                }

                .case-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    flex-shrink: 0;
                }

                .badge-warn {
                    background: rgba(245, 158, 11, 0.12);
                    color: #fbbf24;
                    border: 1px solid rgba(245, 158, 11, 0.2);
                }

                .badge-mute {
                    background: rgba(139, 92, 246, 0.12);
                    color: #a78bfa;
                    border: 1px solid rgba(139, 92, 246, 0.2);
                }

                .badge-kick {
                    background: rgba(249, 115, 22, 0.12);
                    color: #fb923c;
                    border: 1px solid rgba(249, 115, 22, 0.2);
                }

                .badge-ban {
                    background: rgba(239, 68, 68, 0.12);
                    color: #f87171;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                }

                .badge-pending {
                    background: rgba(245, 158, 11, 0.12);
                    color: #fbbf24;
                    border: 1px solid rgba(245, 158, 11, 0.2);
                }

                .badge-approved {
                    background: rgba(16, 185, 129, 0.12);
                    color: #34d399;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                }

                .badge-denied {
                    background: rgba(239, 68, 68, 0.12);
                    color: #f87171;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                }

                .case-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 0;
                }

                .case-user {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .case-reason {
                    font-size: 13px;
                    color: var(--text-muted);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .case-meta {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 2px;
                }

                .case-id {
                    font-size: 12px;
                    font-family: var(--font-mono);
                    color: var(--text-muted);
                }

                .case-date {
                    font-size: 12px;
                    color: var(--text-dim);
                }

                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 48px 24px;
                    text-align: center;
                }

                .empty-state p {
                    font-size: 15px;
                    color: var(--text-secondary);
                    margin-bottom: 4px;
                }

                .empty-state span {
                    font-size: 13px;
                    color: var(--text-muted);
                }

                .detail-label {
                    display: block;
                    font-size: 11px;
                    color: var(--text-muted);
                    margin-bottom: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    font-weight: 600;
                }

                .detail-value {
                    font-size: 15px;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .detail-box {
                    background: var(--bg-primary);
                    padding: 14px;
                    border-radius: 8px;
                    border: 1px solid var(--border-subtle);
                    line-height: 1.6;
                    font-size: 14px;
                    color: var(--text-secondary);
                }
            `}</style>
        </div>
    );
}
