'use client';

import { useState, useEffect, useMemo } from 'react';
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
    closed_at?: string;
    claimed_by?: string;
    claimed_by_tag?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    category?: string;
}

interface TicketStats {
    total: number;
    open: number;
    closed: number;
    claimed: number;
    unclaimed: number;
    avgResponseTime: number;
    avgResolutionTime: number;
    openedThisWeek: number;
    closedThisWeek: number;
    staffLeaderboard: Array<{ id: string; tag: string; claimed: number; closed: number }>;
}

type SortField = 'created_at' | 'status' | 'user_tag' | 'priority';
type SortDir = 'asc' | 'desc';

export default function TicketsPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [stats, setStats] = useState<TicketStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'open' | 'closed' | 'unclaimed' | 'mine'>('open');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDir, setSortDir] = useState<SortDir>('desc');
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [showStats, setShowStats] = useState(true);

    useEffect(() => {
        if (session) {
            fetchTickets();
        }
    }, [session]);

    const fetchTickets = async () => {
        try {
            // Try enhanced endpoint first, fall back to basic
            let res = await fetch('/api/tickets/stats');
            if (res.ok) {
                const data = await res.json();
                setTickets(data.tickets || []);
                setStats(data.stats || null);
            } else {
                res = await fetch('/api/bot/tickets');
                if (res.ok) setTickets(await res.json());
            }
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

    // Filtering and sorting
    const filteredTickets = useMemo(() => {
        let result = [...tickets];
        
        // Apply filter
        switch (filter) {
            case 'open':
                result = result.filter(t => t.status === 'open');
                break;
            case 'closed':
                result = result.filter(t => t.status === 'closed');
                break;
            case 'unclaimed':
                result = result.filter(t => t.status === 'open' && !t.claimed_by);
                break;
            case 'mine':
                // Would need current user ID - for now show claimed
                result = result.filter(t => t.claimed_by);
                break;
        }
        
        // Apply search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t => 
                t.user_tag?.toLowerCase().includes(q) ||
                t.user_id.includes(q) ||
                t.subject?.toLowerCase().includes(q) ||
                t.id.includes(q)
            );
        }
        
        // Apply sort
        result.sort((a, b) => {
            let cmp = 0;
            switch (sortField) {
                case 'created_at':
                    cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                    break;
                case 'status':
                    cmp = a.status.localeCompare(b.status);
                    break;
                case 'user_tag':
                    cmp = (a.user_tag || '').localeCompare(b.user_tag || '');
                    break;
                case 'priority':
                    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
                    cmp = (priorityOrder[a.priority || 'normal'] || 2) - (priorityOrder[b.priority || 'normal'] || 2);
                    break;
            }
            return sortDir === 'desc' ? -cmp : cmp;
        });
        
        return result;
    }, [tickets, filter, searchQuery, sortField, sortDir]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const getTimeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'urgent': return '#ef4444';
            case 'high': return '#f59e0b';
            case 'low': return '#6b7280';
            default: return '#3b82f6';
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

    const openCount = tickets.filter(t => t.status === 'open').length;
    const unclaimedCount = tickets.filter(t => t.status === 'open' && !t.claimed_by).length;

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div>
                    {/* Header */}
                    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 className="page-title">Tickets</h1>
                            <p className="page-subtitle">Manage support tickets from Discord</p>
                        </div>
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => setShowStats(!showStats)}
                            style={{ fontSize: '12px' }}
                        >
                            {showStats ? 'Hide Stats' : 'Show Stats'}
                        </button>
                    </div>

                    {/* Stats Dashboard */}
                    {showStats && stats && (
                        <section className="stats-grid" style={{ marginBottom: '24px' }}>
                            <div className="stat-card">
                                <div className="stat-label"><span className="stat-icon">📨</span> Open</div>
                                <div className="stat-value" style={{ color: openCount > 0 ? '#f59e0b' : 'var(--text-primary)' }}>{stats.open}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label"><span className="stat-icon">🚨</span> Unclaimed</div>
                                <div className="stat-value" style={{ color: unclaimedCount > 0 ? '#ef4444' : 'var(--text-primary)' }}>{stats.unclaimed}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label"><span className="stat-icon">✅</span> Closed (Week)</div>
                                <div className="stat-value" style={{ color: '#10b981' }}>{stats.closedThisWeek}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label"><span className="stat-icon">📊</span> Opened (Week)</div>
                                <div className="stat-value">{stats.openedThisWeek}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label"><span className="stat-icon">⏱️</span> Avg Response</div>
                                <div className="stat-value">{stats.avgResponseTime}m</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label"><span className="stat-icon">🏁</span> Avg Resolution</div>
                                <div className="stat-value">{stats.avgResolutionTime > 60 ? `${Math.round(stats.avgResolutionTime / 60)}h` : `${stats.avgResolutionTime}m`}</div>
                            </div>
                        </section>
                    )}

                    {/* Staff Leaderboard (if stats available) */}
                    {showStats && stats?.staffLeaderboard && stats.staffLeaderboard.length > 0 && (
                        <div className="card" style={{ marginBottom: '24px' }}>
                            <div className="card-header">
                                <h3 className="card-title">🏆 Staff Leaderboard</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', padding: '16px', overflowX: 'auto' }}>
                                {stats.staffLeaderboard.map((staff, i) => (
                                    <div key={staff.id} style={{ 
                                        flex: '0 0 auto',
                                        padding: '16px 20px',
                                        background: 'var(--bg-primary)',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-subtle)',
                                        minWidth: '140px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                        </div>
                                        <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px' }}>{staff.tag}</div>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '12px' }}>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)' }}>Claimed</div>
                                                <div style={{ fontWeight: 600 }}>{staff.claimed}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)' }}>Closed</div>
                                                <div style={{ fontWeight: 600, color: '#10b981' }}>{staff.closed}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Filters and Search */}
                    <div className="card">
                        <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {[
                                    { key: 'open', label: 'Open', count: openCount },
                                    { key: 'unclaimed', label: 'Unclaimed', count: unclaimedCount },
                                    { key: 'closed', label: 'Closed' },
                                    { key: 'all', label: 'All' },
                                ].map(f => (
                                    <button
                                        key={f.key}
                                        className={`btn ${filter === f.key ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setFilter(f.key as typeof filter)}
                                        style={{ fontSize: '12px', padding: '6px 12px' }}
                                    >
                                        {f.label}
                                        {f.count !== undefined && f.count > 0 && (
                                            <span style={{ 
                                                marginLeft: '6px', 
                                                background: filter === f.key ? 'rgba(255,255,255,0.2)' : 'var(--bg-hover)',
                                                padding: '2px 6px',
                                                borderRadius: '8px',
                                                fontSize: '10px',
                                                fontWeight: 700
                                            }}>{f.count}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }}>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Search by user, subject, ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ fontSize: '13px', padding: '8px 12px' }}
                                />
                            </div>
                        </div>

                        {/* Table Header */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 2fr 1fr 1fr 100px',
                            gap: '8px',
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border-subtle)',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            <div onClick={() => toggleSort('user_tag')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                User {sortField === 'user_tag' && (sortDir === 'asc' ? '↑' : '↓')}
                            </div>
                            <div>Subject</div>
                            <div onClick={() => toggleSort('status')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Status {sortField === 'status' && (sortDir === 'asc' ? '↑' : '↓')}
                            </div>
                            <div>Assigned To</div>
                            <div onClick={() => toggleSort('created_at')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                Created {sortField === 'created_at' && (sortDir === 'asc' ? '↑' : '↓')}
                            </div>
                        </div>

                        {/* Tickets List */}
                        {loading ? (
                            <div className="empty-state">Loading tickets...</div>
                        ) : filteredTickets.length > 0 ? (
                            <div>
                                {filteredTickets.map(ticket => (
                                    <div 
                                        key={ticket.id}
                                        onClick={() => setSelectedTicket(ticket)}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 2fr 1fr 1fr 100px',
                                            gap: '8px',
                                            padding: '14px 16px',
                                            borderBottom: '1px solid var(--border-subtle)',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s',
                                            alignItems: 'center',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 500, fontSize: '14px' }}>{ticket.user_tag || 'Unknown'}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{ticket.user_id.slice(0, 12)}...</div>
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {ticket.subject || 'Support Ticket'}
                                        </div>
                                        <div>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                background: ticket.status === 'open' 
                                                    ? 'rgba(245, 158, 11, 0.15)' 
                                                    : 'rgba(16, 185, 129, 0.15)',
                                                color: ticket.status === 'open' ? '#f59e0b' : '#10b981',
                                            }}>
                                                <span style={{ 
                                                    width: '6px', 
                                                    height: '6px', 
                                                    borderRadius: '50%', 
                                                    background: ticket.status === 'open' ? '#f59e0b' : '#10b981'
                                                }} />
                                                {ticket.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: ticket.claimed_by_tag ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                                            {ticket.claimed_by_tag || '—'}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {getTimeAgo(ticket.created_at)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state" style={{ padding: '48px' }}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                                <div>No {filter !== 'all' ? filter : ''} tickets found</div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Ticket Details Modal */}
            <Modal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} title="Ticket Details" size="md">
                {selectedTicket && (
                    <div>
                        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{
                                    padding: '6px 14px',
                                    borderRadius: '16px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    background: selectedTicket.status === 'open' 
                                        ? 'rgba(245, 158, 11, 0.15)' 
                                        : 'rgba(16, 185, 129, 0.15)',
                                    color: selectedTicket.status === 'open' ? '#f59e0b' : '#10b981',
                                }}>
                                    {selectedTicket.status.toUpperCase()}
                                </span>
                                {selectedTicket.priority && (
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '12px',
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        background: 'var(--bg-primary)',
                                        color: getPriorityColor(selectedTicket.priority),
                                        textTransform: 'uppercase',
                                    }}>
                                        {selectedTicket.priority}
                                    </span>
                                )}
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                                {getTimeAgo(selectedTicket.created_at)}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>User</label>
                                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedTicket.user_tag || 'Unknown'}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{selectedTicket.user_id}</div>
                            </div>
                            
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Subject</label>
                                <div style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{selectedTicket.subject || 'Support Ticket'}</div>
                            </div>

                            {selectedTicket.claimed_by_tag && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Claimed By</label>
                                    <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--accent-blue)' }}>
                                        {selectedTicket.claimed_by_tag}
                                    </div>
                                </div>
                            )}
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Created</label>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{new Date(selectedTicket.created_at).toLocaleString()}</div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Ticket ID</label>
                                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '12px' }}>{selectedTicket.id}</div>
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
        </div>
    );
}
