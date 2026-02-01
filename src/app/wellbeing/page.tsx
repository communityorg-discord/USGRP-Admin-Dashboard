'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSession } from '@/hooks/useSession';

// Types
interface WellbeingEntry {
    id: string;
    staffId: string;
    staffName: string;
    staffRole: string;
    staffAvatar?: string;
    status: WellbeingStatus;
    category: WellbeingCategory;
    notes: string;
    lastCheckin: string;
    nextCheckin: string;
    assignedSupervisor: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    createdAt: string;
    updatedAt: string;
}

type WellbeingStatus = 
    | 'excellent'
    | 'good'
    | 'stable'
    | 'needs-attention'
    | 'at-risk'
    | 'on-leave'
    | 'returning'
    | 'new-hire'
    | 'probation'
    | 'mentoring'
    | 'burnout-watch'
    | 'inactive';

type WellbeingCategory = 
    | 'all'
    | 'mental-health'
    | 'workload'
    | 'performance'
    | 'team-dynamics'
    | 'career-growth';

interface WellbeingStats {
    totalStaff: number;
    excellent: number;
    good: number;
    needsAttention: number;
    atRisk: number;
    onLeave: number;
    pendingCheckins: number;
}

type ViewMode = 'list' | 'kanban';
type TabType = 'all' | 'mental-health' | 'workload' | 'performance' | 'team-dynamics' | 'career-growth';

export default function WellbeingPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [entries, setEntries] = useState<WellbeingEntry[]>([]);
    const [stats, setStats] = useState<WellbeingStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [activeCategory, setActiveCategory] = useState<TabType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<WellbeingEntry | null>(null);

    // Status configuration
    const statusConfig: Record<WellbeingStatus, { label: string; color: string; icon: string; description: string }> = {
        'excellent': { label: 'Excellent', color: '#3fb950', icon: '🌟', description: 'Thriving and exceeding expectations' },
        'good': { label: 'Good', color: '#58a6ff', icon: '👍', description: 'Performing well with no concerns' },
        'stable': { label: 'Stable', color: '#8b949e', icon: '➖', description: 'Maintaining steady performance' },
        'needs-attention': { label: 'Needs Attention', color: '#d29922', icon: '⚠️', description: 'Some concerns requiring follow-up' },
        'at-risk': { label: 'At Risk', color: '#f85149', icon: '🚨', description: 'Immediate intervention needed' },
        'on-leave': { label: 'On Leave', color: '#a371f7', icon: '🏖️', description: 'Currently on approved leave' },
        'returning': { label: 'Returning', color: '#79c0ff', icon: '↩️', description: 'Returning from leave soon' },
        'new-hire': { label: 'New Hire', color: '#7ee787', icon: '🆕', description: 'Recently joined the team' },
        'probation': { label: 'Probation', color: '#f0883e', icon: '📋', description: 'In probationary period' },
        'mentoring': { label: 'In Mentoring', color: '#d2a8ff', icon: '🎓', description: 'Receiving additional support' },
        'burnout-watch': { label: 'Burnout Watch', color: '#ff7b72', icon: '🔥', description: 'Showing signs of burnout' },
        'inactive': { label: 'Inactive', color: '#6e7681', icon: '💤', description: 'Currently inactive' },
    };

    const categoryConfig: Record<WellbeingCategory, { label: string; icon: string; description: string }> = {
        'all': { label: 'All Categories', icon: '📊', description: 'All wellbeing entries' },
        'mental-health': { label: 'Mental Health', icon: '🧠', description: 'Mental health and wellness' },
        'workload': { label: 'Workload', icon: '⚖️', description: 'Work-life balance and capacity' },
        'performance': { label: 'Performance', icon: '📈', description: 'Performance concerns' },
        'team-dynamics': { label: 'Team Dynamics', icon: '👥', description: 'Team relationships and conflicts' },
        'career-growth': { label: 'Career Growth', icon: '🚀', description: 'Career development and goals' },
    };

    // Fetch data
    useEffect(() => {
        if (session) {
            loadData();
        }
    }, [session]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Try to fetch from API
            const entriesRes = await fetch('/api/wellbeing/entries');
            if (entriesRes.ok) {
                const data = await entriesRes.json();
                setEntries(data);
            } else {
                // Mock data
                setEntries([
                    { id: '1', staffId: '1', staffName: 'Alex Johnson', staffRole: 'Senior Moderator', status: 'excellent', category: 'performance', notes: 'Consistently exceeding expectations. Great team leadership.', lastCheckin: '2025-01-28', nextCheckin: '2025-02-11', assignedSupervisor: 'Sarah Chen', priority: 'low', createdAt: '2024-06-15', updatedAt: '2025-01-28' },
                    { id: '2', staffId: '2', staffName: 'Sarah Chen', staffRole: 'Moderator', status: 'good', category: 'workload', notes: 'Managing workload well. No concerns at this time.', lastCheckin: '2025-01-25', nextCheckin: '2025-02-08', assignedSupervisor: 'James Brown', priority: 'low', createdAt: '2024-08-22', updatedAt: '2025-01-25' },
                    { id: '3', staffId: '3', staffName: 'Mike Wilson', staffRole: 'Support Lead', status: 'burnout-watch', category: 'mental-health', notes: 'Working long hours. Recommend reducing ticket quota.', lastCheckin: '2025-01-30', nextCheckin: '2025-02-02', assignedSupervisor: 'James Brown', priority: 'high', createdAt: '2024-05-10', updatedAt: '2025-01-30' },
                    { id: '4', staffId: '4', staffName: 'Emma Davis', staffRole: 'Trial Moderator', status: 'new-hire', category: 'career-growth', notes: 'Settling in well. Scheduled for first review.', lastCheckin: '2025-01-29', nextCheckin: '2025-02-05', assignedSupervisor: 'Alex Johnson', priority: 'medium', createdAt: '2025-01-05', updatedAt: '2025-01-29' },
                    { id: '5', staffId: '5', staffName: 'James Brown', staffRole: 'Admin', status: 'stable', category: 'team-dynamics', notes: 'Solid performance. Team reports positive feedback.', lastCheckin: '2025-01-20', nextCheckin: '2025-02-20', assignedSupervisor: 'N/A', priority: 'low', createdAt: '2024-01-20', updatedAt: '2025-01-20' },
                    { id: '6', staffId: '6', staffName: 'Lisa Martinez', staffRole: 'Support Agent', status: 'needs-attention', category: 'workload', notes: 'Struggling with ticket volume. Consider reassignment.', lastCheckin: '2025-01-31', nextCheckin: '2025-02-03', assignedSupervisor: 'Mike Wilson', priority: 'medium', createdAt: '2024-11-12', updatedAt: '2025-01-31' },
                    { id: '7', staffId: '7', staffName: 'David Kim', staffRole: 'Moderator', status: 'on-leave', category: 'mental-health', notes: 'Personal leave until Feb 15. Check in upon return.', lastCheckin: '2025-01-15', nextCheckin: '2025-02-16', assignedSupervisor: 'Sarah Chen', priority: 'low', createdAt: '2024-07-03', updatedAt: '2025-01-15' },
                    { id: '8', staffId: '8', staffName: 'Rachel Green', staffRole: 'Trial Moderator', status: 'probation', category: 'performance', notes: 'Performance review scheduled. Some concerns with response times.', lastCheckin: '2025-01-28', nextCheckin: '2025-02-01', assignedSupervisor: 'Alex Johnson', priority: 'high', createdAt: '2024-12-01', updatedAt: '2025-01-28' },
                    { id: '9', staffId: '9', staffName: 'Tom Harris', staffRole: 'Support Agent', status: 'mentoring', category: 'career-growth', notes: 'Paired with Mike for skill development.', lastCheckin: '2025-01-27', nextCheckin: '2025-02-03', assignedSupervisor: 'Mike Wilson', priority: 'medium', createdAt: '2024-09-18', updatedAt: '2025-01-27' },
                    { id: '10', staffId: '10', staffName: 'Anna White', staffRole: 'Moderator', status: 'at-risk', category: 'team-dynamics', notes: 'Conflict with team member. Mediation required.', lastCheckin: '2025-01-31', nextCheckin: '2025-02-01', assignedSupervisor: 'James Brown', priority: 'critical', createdAt: '2024-04-22', updatedAt: '2025-01-31' },
                    { id: '11', staffId: '11', staffName: 'Chris Taylor', staffRole: 'Moderator', status: 'returning', category: 'mental-health', notes: 'Returning from medical leave Feb 3rd.', lastCheckin: '2025-01-20', nextCheckin: '2025-02-03', assignedSupervisor: 'Sarah Chen', priority: 'medium', createdAt: '2024-03-15', updatedAt: '2025-01-20' },
                    { id: '12', staffId: '12', staffName: 'Julia Roberts', staffRole: 'Support Agent', status: 'inactive', category: 'workload', notes: 'On extended leave. Status TBD.', lastCheckin: '2024-12-15', nextCheckin: '2025-03-01', assignedSupervisor: 'Mike Wilson', priority: 'low', createdAt: '2024-06-08', updatedAt: '2024-12-15' },
                ]);
            }

            // Fetch stats
            const statsRes = await fetch('/api/wellbeing/stats');
            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
            } else {
                // Calculate from entries
                setStats({
                    totalStaff: 12,
                    excellent: 1,
                    good: 1,
                    needsAttention: 2,
                    atRisk: 1,
                    onLeave: 2,
                    pendingCheckins: 4,
                });
            }
        } catch (error) {
            console.error('Failed to load wellbeing data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filtered entries
    const filteredEntries = useMemo(() => {
        return entries.filter(e => {
            const matchesSearch = e.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.staffRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.notes.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'all' || e.category === activeCategory;
            const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
            const matchesPriority = filterPriority === 'all' || e.priority === filterPriority;
            return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
        });
    }, [entries, searchQuery, activeCategory, filterStatus, filterPriority]);

    // Group by status for Kanban
    const kanbanGroups = useMemo(() => {
        const groups: Record<string, WellbeingEntry[]> = {};
        const statusOrder: WellbeingStatus[] = ['at-risk', 'burnout-watch', 'needs-attention', 'probation', 'mentoring', 'new-hire', 'returning', 'stable', 'good', 'excellent', 'on-leave', 'inactive'];
        
        statusOrder.forEach(status => {
            groups[status] = filteredEntries.filter(e => e.status === status);
        });
        
        return groups;
    }, [filteredEntries]);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return '#f85149';
            case 'high': return '#f0883e';
            case 'medium': return '#d29922';
            case 'low': return '#8b949e';
            default: return '#8b949e';
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const isOverdue = (dateStr: string) => {
        return new Date(dateStr) < new Date();
    };

    if (sessionLoading) {
        return (
            <div className="admin-layout">
                <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div>
                    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 className="page-title">Staff Wellbeing</h1>
                            <p className="page-subtitle">Monitor and support staff wellness across all categories</p>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowAddModal(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <span>+</span> New Check-in
                        </button>
                    </div>

                    {/* Stats Grid - 6 Cards */}
                    <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 'var(--spacing-lg)' }}>
                        <div className="stat-card">
                            <div className="stat-label"><span className="stat-icon">👥</span> Total Staff</div>
                            <div className="stat-value">{stats?.totalStaff || 0}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label"><span className="stat-icon" style={{ color: '#3fb950' }}>🌟</span> Excellent</div>
                            <div className="stat-value" style={{ color: '#3fb950' }}>{stats?.excellent || 0}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label"><span className="stat-icon" style={{ color: '#58a6ff' }}>👍</span> Good</div>
                            <div className="stat-value" style={{ color: '#58a6ff' }}>{stats?.good || 0}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label"><span className="stat-icon" style={{ color: '#d29922' }}>⚠️</span> Needs Attention</div>
                            <div className="stat-value" style={{ color: '#d29922' }}>{stats?.needsAttention || 0}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label"><span className="stat-icon" style={{ color: '#f85149' }}>🚨</span> At Risk</div>
                            <div className="stat-value" style={{ color: '#f85149' }}>{stats?.atRisk || 0}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label"><span className="stat-icon" style={{ color: '#f0883e' }}>📅</span> Pending Check-ins</div>
                            <div className="stat-value" style={{ color: '#f0883e' }}>{stats?.pendingCheckins || 0}</div>
                        </div>
                    </div>

                    {/* Category Tabs - 5 Categories */}
                    <div style={{
                        display: 'flex',
                        gap: 'var(--spacing-xs)',
                        marginBottom: 'var(--spacing-lg)',
                        borderBottom: '1px solid var(--border-default)',
                        paddingBottom: 'var(--spacing-sm)',
                    }}>
                        {(Object.keys(categoryConfig) as TabType[]).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                style={{
                                    padding: '10px 16px',
                                    background: activeCategory === cat ? 'var(--bg-elevated)' : 'transparent',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                                    color: activeCategory === cat ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontWeight: activeCategory === cat ? 600 : 400,
                                    transition: 'all 0.15s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                <span>{categoryConfig[cat].icon}</span>
                                {categoryConfig[cat].label}
                                {cat !== 'all' && (
                                    <span style={{
                                        background: activeCategory === cat ? 'var(--accent-primary)' : 'var(--bg-hover)',
                                        padding: '2px 6px',
                                        borderRadius: '10px',
                                        fontSize: '11px',
                                    }}>
                                        {entries.filter(e => e.category === cat).length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Filters and View Toggle */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search staff..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ flex: '1', minWidth: '200px' }}
                        />
                        <select
                            className="form-input"
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            style={{ width: '180px' }}
                        >
                            <option value="all">All Statuses</option>
                            {Object.entries(statusConfig).map(([key, config]) => (
                                <option key={key} value={key}>{config.icon} {config.label}</option>
                            ))}
                        </select>
                        <select
                            className="form-input"
                            value={filterPriority}
                            onChange={e => setFilterPriority(e.target.value)}
                            style={{ width: '140px' }}
                        >
                            <option value="all">All Priority</option>
                            <option value="critical">🔴 Critical</option>
                            <option value="high">🟠 High</option>
                            <option value="medium">🟡 Medium</option>
                            <option value="low">⚪ Low</option>
                        </select>
                        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                            <button
                                className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setViewMode('list')}
                                style={{ padding: '8px 12px' }}
                                title="List View"
                            >
                                ☰
                            </button>
                            <button
                                className={`btn ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setViewMode('kanban')}
                                style={{ padding: '8px 12px' }}
                                title="Kanban View"
                            >
                                ▦
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="empty-state">Loading wellbeing data...</div>
                    ) : viewMode === 'list' ? (
                        /* List View */
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">📋 Staff Wellbeing ({filteredEntries.length})</h3>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Staff Member</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Category</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Priority</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Notes</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Last Check-in</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Next Check-in</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEntries.map(entry => (
                                            <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-muted)' }}>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{
                                                            width: '36px',
                                                            height: '36px',
                                                            borderRadius: '50%',
                                                            background: 'var(--bg-elevated)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '14px',
                                                        }}>
                                                            👤
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 500 }}>{entry.staffName}</div>
                                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{entry.staffRole}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        background: `${statusConfig[entry.status].color}20`,
                                                        color: statusConfig[entry.status].color,
                                                        fontSize: '12px',
                                                        fontWeight: 500,
                                                    }}>
                                                        {statusConfig[entry.status].icon} {statusConfig[entry.status].label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                                        {categoryConfig[entry.category].icon} {categoryConfig[entry.category].label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        width: '10px',
                                                        height: '10px',
                                                        borderRadius: '50%',
                                                        background: getPriorityColor(entry.priority),
                                                    }} title={entry.priority} />
                                                </td>
                                                <td style={{ padding: '12px 16px', maxWidth: '250px' }}>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {entry.notes}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                    {formatDate(entry.lastCheckin)}
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                    <span style={{
                                                        fontSize: '13px',
                                                        color: isOverdue(entry.nextCheckin) ? '#f85149' : 'var(--text-secondary)',
                                                        fontWeight: isOverdue(entry.nextCheckin) ? 600 : 400,
                                                    }}>
                                                        {formatDate(entry.nextCheckin)}
                                                        {isOverdue(entry.nextCheckin) && ' ⚠️'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ padding: '4px 10px', fontSize: '12px' }}
                                                        onClick={() => setSelectedEntry(entry)}
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredEntries.length === 0 && (
                                <div className="empty-state">No entries match your filters</div>
                            )}
                        </div>
                    ) : (
                        /* Kanban View */
                        <div style={{
                            display: 'flex',
                            gap: 'var(--spacing-md)',
                            overflowX: 'auto',
                            paddingBottom: 'var(--spacing-md)',
                        }}>
                            {Object.entries(kanbanGroups).filter(([_, items]) => items.length > 0).map(([status, items]) => (
                                <div
                                    key={status}
                                    style={{
                                        minWidth: '280px',
                                        maxWidth: '320px',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-lg)',
                                        border: '1px solid var(--border-default)',
                                    }}
                                >
                                    {/* Column Header */}
                                    <div style={{
                                        padding: 'var(--spacing-md)',
                                        borderBottom: '1px solid var(--border-default)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '50%',
                                                background: statusConfig[status as WellbeingStatus].color,
                                            }} />
                                            <span style={{ fontWeight: 600, fontSize: '13px' }}>
                                                {statusConfig[status as WellbeingStatus].icon} {statusConfig[status as WellbeingStatus].label}
                                            </span>
                                        </div>
                                        <span style={{
                                            background: 'var(--bg-elevated)',
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            fontSize: '12px',
                                            color: 'var(--text-secondary)',
                                        }}>
                                            {items.length}
                                        </span>
                                    </div>

                                    {/* Cards */}
                                    <div style={{ padding: 'var(--spacing-sm)', maxHeight: '500px', overflowY: 'auto' }}>
                                        {items.map(entry => (
                                            <div
                                                key={entry.id}
                                                onClick={() => setSelectedEntry(entry)}
                                                style={{
                                                    background: 'var(--bg-tertiary)',
                                                    borderRadius: 'var(--radius-md)',
                                                    padding: 'var(--spacing-md)',
                                                    marginBottom: 'var(--spacing-sm)',
                                                    cursor: 'pointer',
                                                    border: '1px solid var(--border-muted)',
                                                    transition: 'border-color 0.15s, transform 0.15s',
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.borderColor = 'var(--border-default)';
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.borderColor = 'var(--border-muted)';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                    <div style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '50%',
                                                        background: 'var(--bg-elevated)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '12px',
                                                    }}>
                                                        👤
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 500, fontSize: '13px' }}>{entry.staffName}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{entry.staffRole}</div>
                                                    </div>
                                                    <span style={{
                                                        marginLeft: 'auto',
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        background: getPriorityColor(entry.priority),
                                                    }} title={`${entry.priority} priority`} />
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.4 }}>
                                                    {entry.notes.length > 80 ? entry.notes.slice(0, 80) + '...' : entry.notes}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                                                        {categoryConfig[entry.category].icon} {categoryConfig[entry.category].label}
                                                    </span>
                                                    <span style={{
                                                        color: isOverdue(entry.nextCheckin) ? '#f85149' : 'var(--text-muted)',
                                                    }}>
                                                        📅 {formatDate(entry.nextCheckin)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Detail Modal */}
            {selectedEntry && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setSelectedEntry(null)}
                >
                    <div
                        style={{
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-default)',
                            padding: 'var(--spacing-xl)',
                            maxWidth: '600px',
                            width: '90%',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-lg)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '50%',
                                    background: 'var(--bg-elevated)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px',
                                }}>
                                    👤
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>{selectedEntry.staffName}</h2>
                                    <div style={{ color: 'var(--text-secondary)' }}>{selectedEntry.staffRole}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedEntry(null)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '20px',
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Status</div>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    borderRadius: '16px',
                                    background: `${statusConfig[selectedEntry.status].color}20`,
                                    color: statusConfig[selectedEntry.status].color,
                                    fontWeight: 500,
                                }}>
                                    {statusConfig[selectedEntry.status].icon} {statusConfig[selectedEntry.status].label}
                                </span>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Category</div>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {categoryConfig[selectedEntry.category].icon} {categoryConfig[selectedEntry.category].label}
                                </span>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Priority</div>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: getPriorityColor(selectedEntry.priority),
                                    }} />
                                    {selectedEntry.priority.charAt(0).toUpperCase() + selectedEntry.priority.slice(1)}
                                </span>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Assigned Supervisor</div>
                                <span>{selectedEntry.assignedSupervisor}</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Notes</div>
                            <div style={{
                                background: 'var(--bg-tertiary)',
                                padding: 'var(--spacing-md)',
                                borderRadius: 'var(--radius-md)',
                                lineHeight: 1.6,
                            }}>
                                {selectedEntry.notes}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Last Check-in</div>
                                <span>{new Date(selectedEntry.lastCheckin).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Next Check-in</div>
                                <span style={{ color: isOverdue(selectedEntry.nextCheckin) ? '#f85149' : 'inherit' }}>
                                    {new Date(selectedEntry.nextCheckin).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                    {isOverdue(selectedEntry.nextCheckin) && ' (Overdue)'}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setSelectedEntry(null)}>Close</button>
                            <button className="btn btn-primary">Schedule Check-in</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setShowAddModal(false)}
                >
                    <div
                        style={{
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid var(--border-default)',
                            padding: 'var(--spacing-xl)',
                            maxWidth: '500px',
                            width: '90%',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>New Wellbeing Check-in</h2>
                        <form onSubmit={e => { e.preventDefault(); setShowAddModal(false); }}>
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <label className="form-label">Staff Member</label>
                                <select className="form-input">
                                    <option value="">Select staff member...</option>
                                    {entries.map(e => (
                                        <option key={e.id} value={e.staffId}>{e.staffName}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <label className="form-label">Status</label>
                                <select className="form-input">
                                    {Object.entries(statusConfig).map(([key, config]) => (
                                        <option key={key} value={key}>{config.icon} {config.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <label className="form-label">Category</label>
                                <select className="form-input">
                                    {Object.entries(categoryConfig).filter(([k]) => k !== 'all').map(([key, config]) => (
                                        <option key={key} value={key}>{config.icon} {config.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <label className="form-label">Priority</label>
                                <select className="form-input">
                                    <option value="low">⚪ Low</option>
                                    <option value="medium">🟡 Medium</option>
                                    <option value="high">🟠 High</option>
                                    <option value="critical">🔴 Critical</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <label className="form-label">Notes</label>
                                <textarea className="form-input" rows={4} placeholder="Enter notes about this check-in..." />
                            </div>
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <label className="form-label">Next Check-in Date</label>
                                <input type="date" className="form-input" />
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Check-in</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
