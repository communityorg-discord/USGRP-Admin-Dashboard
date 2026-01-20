'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';

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

export default function CasesPage() {
    const router = useRouter();
    const [session, setSession] = useState<{ email?: string; permissionName?: string } | null>(null);
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [selectedCase, setSelectedCase] = useState<Case | null>(null);

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
                    const res = await fetch('/api/bot/cases');
                    if (res.ok) setCases(await res.json());
                } catch { }
                setLoading(false);
            });
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    const filteredCases = filter === 'all' ? cases : cases.filter(c => c.action_type === filter);

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={handleLogout} />

            <main className="admin-main">
                <div style={{ maxWidth: '1200px' }}>
                    <div className="page-header">
                        <h1 className="page-title">Cases</h1>
                        <p className="page-subtitle">View and manage moderation cases</p>
                    </div>

                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {['all', 'warn', 'mute', 'kick', 'ban', 'unban'].map((f) => (
                                <button
                                    key={f}
                                    className={`quick-action-btn ${filter === f ? f : ''}`}
                                    onClick={() => setFilter(f)}
                                    style={filter === f ? { borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' } : {}}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">📋 Cases ({filteredCases.length})</h3>
                        </div>
                        {loading ? (
                            <div className="empty-state">Loading cases...</div>
                        ) : filteredCases.length > 0 ? (
                            filteredCases.map((c) => (
                                <div key={c.case_id} className="case-item" style={{ cursor: 'pointer' }} onClick={() => setSelectedCase(c)}>
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
                            ))
                        ) : (
                            <div className="empty-state">No cases found</div>
                        )}
                    </div>
                </div>
            </main>

            <Modal isOpen={!!selectedCase} onClose={() => setSelectedCase(null)} title="Case Details" size="md">
                {selectedCase && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div>
                                <div className="form-label">User</div>
                                <div style={{ color: 'var(--text-primary)' }}>{selectedCase.user_tag}</div>
                            </div>
                            <div>
                                <div className="form-label">Action</div>
                                <span className={`case-badge badge-${selectedCase.action_type}`}>{selectedCase.action_type.toUpperCase()}</span>
                            </div>
                            <div>
                                <div className="form-label">Moderator</div>
                                <div style={{ color: 'var(--text-primary)' }}>{selectedCase.moderator_tag}</div>
                            </div>
                            <div>
                                <div className="form-label">Date</div>
                                <div style={{ color: 'var(--text-primary)' }}>{new Date(selectedCase.created_at).toLocaleString()}</div>
                            </div>
                        </div>
                        <div>
                            <div className="form-label">Reason</div>
                            <div style={{ color: 'var(--text-primary)' }}>{selectedCase.reason || 'No reason provided'}</div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
