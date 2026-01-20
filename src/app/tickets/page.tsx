'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';

interface Ticket {
    id: string;
    user_id: string;
    user_tag: string;
    channel_id: string;
    created_at: string;
    status: 'open' | 'closed';
    claimed_by?: string;
    claimed_by_tag?: string;
    subject?: string;
}

export default function TicketsPage() {
    const router = useRouter();
    const [session, setSession] = useState<{ email?: string; permissionName?: string; discordId?: string } | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

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
                    const res = await fetch('/api/bot/tickets');
                    if (res.ok) {
                        setTickets(await res.json());
                    }
                } catch { }

                setLoading(false);
            });
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    const filteredTickets = tickets.filter(t => {
        if (filter === 'all') return true;
        return t.status === filter;
    });

    const handleClaimTicket = async (ticketId: string) => {
        try {
            await fetch(`/api/bot/tickets/${ticketId}/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ claimedBy: session?.discordId }),
            });
            // Refresh tickets
            const res = await fetch('/api/bot/tickets');
            if (res.ok) setTickets(await res.json());
            setSelectedTicket(null);
        } catch { }
    };

    const handleCloseTicket = async (ticketId: string) => {
        try {
            await fetch(`/api/bot/tickets/${ticketId}/close`, {
                method: 'POST',
            });
            const res = await fetch('/api/bot/tickets');
            if (res.ok) setTickets(await res.json());
            setSelectedTicket(null);
        } catch { }
    };

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={handleLogout} />

            <main className="admin-main">
                <div style={{ maxWidth: '1200px' }}>
                    <div className="page-header">
                        <h1 className="page-title">Tickets</h1>
                        <p className="page-subtitle">View and manage support tickets</p>
                    </div>

                    {/* Filters */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {(['open', 'closed', 'all'] as const).map((f) => (
                                <button
                                    key={f}
                                    className={`quick-action-btn ${filter === f ? 'active' : ''}`}
                                    onClick={() => setFilter(f)}
                                    style={filter === f ? { borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' } : {}}
                                >
                                    {f === 'open' ? '📬' : f === 'closed' ? '📭' : '📋'} {f.charAt(0).toUpperCase() + f.slice(1)}
                                    <span style={{ marginLeft: '8px', opacity: 0.7 }}>
                                        ({tickets.filter(t => f === 'all' || t.status === f).length})
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">
                                {filter === 'open' ? '📬 Open' : filter === 'closed' ? '📭 Closed' : '📋 All'} Tickets ({filteredTickets.length})
                            </h3>
                        </div>
                        {loading ? (
                            <div className="empty-state">Loading tickets...</div>
                        ) : filteredTickets.length > 0 ? (
                            filteredTickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className="case-item"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setSelectedTicket(ticket)}
                                >
                                    <div className="case-left">
                                        <span className={`case-badge ${ticket.status === 'open' ? 'badge-warn' : 'badge-mute'}`}>
                                            {ticket.status.toUpperCase()}
                                        </span>
                                        <div className="case-info">
                                            <h4>{ticket.user_tag}</h4>
                                            <p>{ticket.subject || 'No subject'}</p>
                                        </div>
                                    </div>
                                    <div className="case-right">
                                        <div className="case-id">#{ticket.id.slice(-6)}</div>
                                        <div className="case-date">{new Date(ticket.created_at).toLocaleDateString()}</div>
                                        {ticket.claimed_by_tag && (
                                            <div style={{ fontSize: '11px', color: 'var(--accent-primary)', marginTop: '2px' }}>
                                                Claimed by {ticket.claimed_by_tag}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <p>No {filter !== 'all' ? filter : ''} tickets</p>
                                <p style={{ marginTop: '8px', fontSize: '12px' }}>Tickets created via /ticket will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Ticket Detail Modal */}
            <Modal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} title="Ticket Details" size="md">
                {selectedTicket && (
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div>
                                <div className="form-label">User</div>
                                <div style={{ color: 'var(--text-primary)' }}>{selectedTicket.user_tag}</div>
                            </div>
                            <div>
                                <div className="form-label">Status</div>
                                <span className={`case-badge ${selectedTicket.status === 'open' ? 'badge-warn' : 'badge-mute'}`}>
                                    {selectedTicket.status.toUpperCase()}
                                </span>
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
                            <div className="form-actions" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                                {!selectedTicket.claimed_by && (
                                    <button className="btn btn-primary" onClick={() => handleClaimTicket(selectedTicket.id)}>
                                        🎫 Claim Ticket
                                    </button>
                                )}
                                <button className="btn btn-danger" onClick={() => handleCloseTicket(selectedTicket.id)}>
                                    ✕ Close Ticket
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
