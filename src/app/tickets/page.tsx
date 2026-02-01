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
    const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');
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

    if (sessionLoading) {
        return (
            <div className="admin-layout">
                <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Loading...</span>
                </div>
            </div>
        );
    }

    const filteredTickets = filter === 'all' 
        ? tickets 
        : tickets.filter(t => filter === 'open' ? t.status === 'open' : t.status === 'closed');

    const openCount = tickets.filter(t => t.status === 'open').length;
    const closedCount = tickets.filter(t => t.status === 'closed').length;

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div>
                    {/* Header */}
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">Tickets</h1>
                            <p className="page-subtitle">Manage support tickets from Discord</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="stats-row">
                        <div className="stat-item">
                            <span className="stat-value">{openCount}</span>
                            <span className="stat-label">Open</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{closedCount}</span>
                            <span className="stat-label">Closed</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{tickets.length}</span>
                            <span className="stat-label">Total</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">All Tickets</h3>
                            <div className="filter-group">
                                {(['open', 'closed', 'all'] as const).map(f => (
                                    <button
                                        key={f}
                                        className={`filter-btn ${filter === f ? 'active' : ''}`}
                                        onClick={() => setFilter(f)}
                                    >
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                        {f === 'open' && openCount > 0 && (
                                            <span className="filter-count">{openCount}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="empty-state">Loading tickets...</div>
                        ) : filteredTickets.length > 0 ? (
                            <div className="tickets-list">
                                {filteredTickets.map(ticket => (
                                    <div 
                                        key={ticket.id} 
                                        className="ticket-row"
                                        onClick={() => setSelectedTicket(ticket)}
                                    >
                                        <span className={`status-dot ${ticket.status}`} />
                                        <div className="ticket-info">
                                            <span className="ticket-user">{ticket.user_tag || ticket.user_id}</span>
                                            <span className="ticket-subject">{ticket.subject || 'Support Ticket'}</span>
                                        </div>
                                        <div className="ticket-meta">
                                            {ticket.claimed_by_tag && (
                                                <span className="ticket-claimed">Claimed by {ticket.claimed_by_tag}</span>
                                            )}
                                            <span className="ticket-date">{new Date(ticket.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No {filter !== 'all' ? filter : ''} tickets</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Ticket Details Modal */}
            <Modal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} title="Ticket Details">
                {selectedTicket && (
                    <div>
                        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className={`status-badge ${selectedTicket.status}`}>
                                    {selectedTicket.status.toUpperCase()}
                                </span>
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                                {new Date(selectedTicket.created_at).toLocaleString()}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div>
                                <label className="detail-label">User</label>
                                <div className="detail-value">{selectedTicket.user_tag || selectedTicket.user_id}</div>
                            </div>
                            
                            <div>
                                <label className="detail-label">Subject</label>
                                <div className="detail-value">{selectedTicket.subject || 'Support Ticket'}</div>
                            </div>

                            {selectedTicket.claimed_by_tag && (
                                <div>
                                    <label className="detail-label">Claimed By</label>
                                    <div className="detail-value" style={{ color: 'var(--accent-blue)' }}>
                                        {selectedTicket.claimed_by_tag}
                                    </div>
                                </div>
                            )}
                            
                            <div>
                                <label className="detail-label">Ticket ID</label>
                                <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                    {selectedTicket.id}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '28px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            {selectedTicket.status === 'open' && (
                                <>
                                    {!selectedTicket.claimed_by && (
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => handleClaim(selectedTicket.id)}
                                        >
                                            Claim Ticket
                                        </button>
                                    )}
                                    <button 
                                        className="btn btn-secondary"
                                        style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}
                                        onClick={() => handleClose(selectedTicket.id)}
                                    >
                                        Close Ticket
                                    </button>
                                </>
                            )}
                            <button className="btn btn-secondary" onClick={() => setSelectedTicket(null)}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <style jsx>{`
                .page-header {
                    margin-bottom: 24px;
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

                .stats-row {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .stat-item {
                    background: var(--bg-elevated);
                    border: 1px solid var(--border-subtle);
                    border-radius: 12px;
                    padding: 20px 28px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .stat-value {
                    font-size: 28px;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .stat-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .filter-group {
                    display: flex;
                    gap: 4px;
                }

                .filter-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
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

                .filter-count {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 1px 6px;
                    border-radius: 8px;
                    font-size: 10px;
                    font-weight: 700;
                }

                .tickets-list {
                    display: flex;
                    flex-direction: column;
                }

                .ticket-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 24px;
                    border-bottom: 1px solid var(--border-subtle);
                    cursor: pointer;
                    transition: background 0.1s;
                }

                .ticket-row:last-child {
                    border-bottom: none;
                }

                .ticket-row:hover {
                    background: var(--bg-hover);
                }

                .status-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .status-dot.open {
                    background: #10b981;
                    box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
                }

                .status-dot.closed {
                    background: #64748b;
                }

                .ticket-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 0;
                }

                .ticket-user {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .ticket-subject {
                    font-size: 13px;
                    color: var(--text-muted);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .ticket-meta {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 2px;
                }

                .ticket-claimed {
                    font-size: 12px;
                    color: var(--accent-blue);
                }

                .ticket-date {
                    font-size: 12px;
                    color: var(--text-dim);
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .status-badge.open {
                    background: rgba(16, 185, 129, 0.12);
                    color: #34d399;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                }

                .status-badge.closed {
                    background: rgba(100, 116, 139, 0.12);
                    color: #94a3b8;
                    border: 1px solid rgba(100, 116, 139, 0.2);
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
            `}</style>
        </div>
    );
}
