'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import { useSession } from '@/hooks/useSession';

interface Ticket {
    id: string;
    user_id: string;
    user_tag?: string;
    subject?: string;
    status: string;
    created_at: string;
    claimed_by?: string;
    claimed_by_tag?: string;
}

export default function TicketsPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    useEffect(() => {
        if (session) {
            fetchTickets();
        }
    }, [session]);

    const fetchTickets = async () => {
        try {
            const res = await fetch('/api/bot/tickets');
            if (res.ok) setTickets(await res.json());
        } catch { }
        setLoading(false);
    };

    const handleClaim = async (id: string) => {
        try {
            await fetch(`/api/bot/tickets/${id}/claim`, { method: 'POST' });
            fetchTickets();
            setSelectedTicket(null);
        } catch { }
    };

    const handleClose = async (id: string) => {
        try {
            await fetch(`/api/bot/tickets/${id}/close`, { method: 'POST' });
            fetchTickets();
            setSelectedTicket(null);
        } catch { }
    };

    if (sessionLoading) return <div className="admin-layout"><div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div></div>;

    const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);
    const openCount = tickets.filter(t => t.status === 'open').length;
    const closedCount = tickets.filter(t => t.status === 'closed').length;

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div style={{ maxWidth: '1200px' }}>
                    <div className="page-header">
                        <h1 className="page-title">Tickets</h1>
                        <p className="page-subtitle">Manage support tickets</p>
                    </div>

                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className={`quick-action-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')} style={filter === 'all' ? { borderColor: 'var(--accent-primary)' } : {}}>
                                All ({tickets.length})
                            </button>
                            <button className={`quick-action-btn ${filter === 'open' ? 'active' : ''}`} onClick={() => setFilter('open')} style={filter === 'open' ? { borderColor: 'var(--accent-success)' } : {}}>
                                Open ({openCount})
                            </button>
                            <button className={`quick-action-btn ${filter === 'closed' ? 'active' : ''}`} onClick={() => setFilter('closed')} style={filter === 'closed' ? { borderColor: 'var(--text-muted)' } : {}}>
                                Closed ({closedCount})
                            </button>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">🎫 Tickets ({filteredTickets.length})</h3>
                        </div>
                        {loading ? (
                            <div className="empty-state">Loading tickets...</div>
                        ) : filteredTickets.length > 0 ? (
                            filteredTickets.map((t) => (
                                <div key={t.id} className="case-item" style={{ cursor: 'pointer' }} onClick={() => setSelectedTicket(t)}>
                                    <div className="case-left">
                                        <span className={`case-badge ${t.status === 'open' ? 'badge-success' : 'badge-muted'}`}>{t.status.toUpperCase()}</span>
                                        <div className="case-info">
                                            <h4>{t.user_tag || t.user_id}</h4>
                                            <p>{t.subject || 'Support ticket'}</p>
                                        </div>
                                    </div>
                                    <div className="case-right">
                                        <div className="case-id">#{t.id}</div>
                                        <div className="case-date">{new Date(t.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">No tickets found</div>
                        )}
                    </div>
                </div>
            </main>

            <Modal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} title="Ticket Details" size="md">
                {selectedTicket && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div>
                                <div className="form-label">User</div>
                                <div style={{ color: 'var(--text-primary)' }}>{selectedTicket.user_tag || selectedTicket.user_id}</div>
                            </div>
                            <div>
                                <div className="form-label">Status</div>
                                <span className={`case-badge ${selectedTicket.status === 'open' ? 'badge-success' : 'badge-muted'}`}>{selectedTicket.status.toUpperCase()}</span>
                            </div>
                            <div>
                                <div className="form-label">Created</div>
                                <div style={{ color: 'var(--text-primary)' }}>{new Date(selectedTicket.created_at).toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="form-label">Claimed By</div>
                                <div style={{ color: 'var(--text-primary)' }}>{selectedTicket.claimed_by_tag || 'Unclaimed'}</div>
                            </div>
                        </div>
                        {selectedTicket.subject && (
                            <div style={{ marginBottom: '20px' }}>
                                <div className="form-label">Subject</div>
                                <div style={{ color: 'var(--text-primary)' }}>{selectedTicket.subject}</div>
                            </div>
                        )}
                        {selectedTicket.status === 'open' && (
                            <div style={{ display: 'flex', gap: '12px' }}>
                                {!selectedTicket.claimed_by && (
                                    <button className="btn btn-primary" onClick={() => handleClaim(selectedTicket.id)}>Claim Ticket</button>
                                )}
                                <button className="btn btn-danger" onClick={() => handleClose(selectedTicket.id)}>Close Ticket</button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
