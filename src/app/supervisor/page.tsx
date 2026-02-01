'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSession } from '@/hooks/useSession';

// Types
interface StaffMember {
    id: string;
    discordId: string;
    displayName: string;
    email: string;
    role: string;
    department: string;
    status: 'online' | 'away' | 'busy' | 'offline';
    lastActive: string;
    casesHandled: number;
    ticketsResolved: number;
    avgResponseTime: number;
    rating: number;
    joinedAt: string;
}

interface TeamMetrics {
    totalStaff: number;
    onlineNow: number;
    avgResponseTime: number;
    casesToday: number;
    ticketsToday: number;
    satisfactionRate: number;
}

interface ActivityLog {
    id: string;
    staffId: string;
    staffName: string;
    action: string;
    target: string;
    timestamp: string;
    type: 'case' | 'ticket' | 'moderation' | 'system';
}

interface PerformanceData {
    date: string;
    cases: number;
    tickets: number;
    avgTime: number;
}

type TabType = 'overview' | 'staff' | 'activity' | 'analytics' | 'settings';

export default function SupervisorPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [metrics, setMetrics] = useState<TeamMetrics | null>(null);
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

    // Fetch data
    useEffect(() => {
        if (session) {
            loadData();
        }
    }, [session, timeRange]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch team metrics
            const metricsRes = await fetch('/api/supervisor/metrics');
            if (metricsRes.ok) {
                const data = await metricsRes.json();
                setMetrics(data);
            } else {
                // Mock data for demo
                setMetrics({
                    totalStaff: 24,
                    onlineNow: 8,
                    avgResponseTime: 4.2,
                    casesToday: 47,
                    ticketsToday: 23,
                    satisfactionRate: 94.5,
                });
            }

            // Fetch staff list
            const staffRes = await fetch('/api/supervisor/staff');
            if (staffRes.ok) {
                const data = await staffRes.json();
                setStaff(data);
            } else {
                // Mock staff data
                setStaff([
                    { id: '1', discordId: '123456789', displayName: 'Alex Johnson', email: 'alex@usgrp.xyz', role: 'Senior Moderator', department: 'Moderation', status: 'online', lastActive: new Date().toISOString(), casesHandled: 342, ticketsResolved: 156, avgResponseTime: 3.2, rating: 4.8, joinedAt: '2024-06-15' },
                    { id: '2', discordId: '234567890', displayName: 'Sarah Chen', email: 'sarah@usgrp.xyz', role: 'Moderator', department: 'Moderation', status: 'online', lastActive: new Date().toISOString(), casesHandled: 189, ticketsResolved: 98, avgResponseTime: 4.1, rating: 4.6, joinedAt: '2024-08-22' },
                    { id: '3', discordId: '345678901', displayName: 'Mike Wilson', email: 'mike@usgrp.xyz', role: 'Support Lead', department: 'Support', status: 'away', lastActive: new Date(Date.now() - 1800000).toISOString(), casesHandled: 78, ticketsResolved: 234, avgResponseTime: 2.8, rating: 4.9, joinedAt: '2024-05-10' },
                    { id: '4', discordId: '456789012', displayName: 'Emma Davis', email: 'emma@usgrp.xyz', role: 'Trial Moderator', department: 'Moderation', status: 'busy', lastActive: new Date().toISOString(), casesHandled: 45, ticketsResolved: 23, avgResponseTime: 5.4, rating: 4.2, joinedAt: '2025-01-05' },
                    { id: '5', discordId: '567890123', displayName: 'James Brown', email: 'james@usgrp.xyz', role: 'Admin', department: 'Administration', status: 'offline', lastActive: new Date(Date.now() - 7200000).toISOString(), casesHandled: 567, ticketsResolved: 312, avgResponseTime: 2.1, rating: 4.95, joinedAt: '2024-01-20' },
                    { id: '6', discordId: '678901234', displayName: 'Lisa Martinez', email: 'lisa@usgrp.xyz', role: 'Support Agent', department: 'Support', status: 'online', lastActive: new Date().toISOString(), casesHandled: 34, ticketsResolved: 178, avgResponseTime: 3.5, rating: 4.7, joinedAt: '2024-11-12' },
                ]);
            }

            // Fetch activity logs
            const activityRes = await fetch('/api/supervisor/activity');
            if (activityRes.ok) {
                const data = await activityRes.json();
                setActivities(data);
            } else {
                // Mock activity data
                setActivities([
                    { id: '1', staffId: '1', staffName: 'Alex Johnson', action: 'Issued warning', target: 'User#1234', timestamp: new Date(Date.now() - 300000).toISOString(), type: 'case' },
                    { id: '2', staffId: '3', staffName: 'Mike Wilson', action: 'Closed ticket', target: 'TICKET-4521', timestamp: new Date(Date.now() - 600000).toISOString(), type: 'ticket' },
                    { id: '3', staffId: '2', staffName: 'Sarah Chen', action: 'Muted user', target: 'User#5678', timestamp: new Date(Date.now() - 900000).toISOString(), type: 'moderation' },
                    { id: '4', staffId: '6', staffName: 'Lisa Martinez', action: 'Resolved ticket', target: 'TICKET-4520', timestamp: new Date(Date.now() - 1200000).toISOString(), type: 'ticket' },
                    { id: '5', staffId: '1', staffName: 'Alex Johnson', action: 'Banned user', target: 'User#9012', timestamp: new Date(Date.now() - 1800000).toISOString(), type: 'case' },
                    { id: '6', staffId: '4', staffName: 'Emma Davis', action: 'Issued warning', target: 'User#3456', timestamp: new Date(Date.now() - 2400000).toISOString(), type: 'case' },
                    { id: '7', staffId: '5', staffName: 'James Brown', action: 'Updated permissions', target: 'Moderator Role', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'system' },
                    { id: '8', staffId: '3', staffName: 'Mike Wilson', action: 'Escalated ticket', target: 'TICKET-4519', timestamp: new Date(Date.now() - 4200000).toISOString(), type: 'ticket' },
                ]);
            }

            // Fetch performance data for charts
            setPerformanceData([
                { date: '2025-01-25', cases: 42, tickets: 28, avgTime: 3.8 },
                { date: '2025-01-26', cases: 38, tickets: 31, avgTime: 4.1 },
                { date: '2025-01-27', cases: 55, tickets: 24, avgTime: 3.5 },
                { date: '2025-01-28', cases: 47, tickets: 35, avgTime: 3.9 },
                { date: '2025-01-29', cases: 51, tickets: 29, avgTime: 3.6 },
                { date: '2025-01-30', cases: 44, tickets: 33, avgTime: 4.0 },
                { date: '2025-01-31', cases: 47, tickets: 23, avgTime: 4.2 },
            ]);
        } catch (error) {
            console.error('Failed to load supervisor data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filtered staff
    const filteredStaff = useMemo(() => {
        return staff.filter(s => {
            const matchesSearch = s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.role.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesDepartment = filterDepartment === 'all' || s.department === filterDepartment;
            const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
            return matchesSearch && matchesDepartment && matchesStatus;
        });
    }, [staff, searchQuery, filterDepartment, filterStatus]);

    // Get unique departments
    const departments = useMemo(() => {
        const depts = new Set(staff.map(s => s.department));
        return Array.from(depts);
    }, [staff]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return '#3fb950';
            case 'away': return '#d29922';
            case 'busy': return '#f85149';
            case 'offline': return '#6e7681';
            default: return '#6e7681';
        }
    };

    const getActionTypeColor = (type: string) => {
        switch (type) {
            case 'case': return 'var(--action-warn)';
            case 'ticket': return 'var(--accent-primary)';
            case 'moderation': return 'var(--action-ban)';
            case 'system': return 'var(--accent-purple)';
            default: return 'var(--text-secondary)';
        }
    };

    const formatTimeAgo = (timestamp: string) => {
        const diff = Date.now() - new Date(timestamp).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    // Simple bar chart component
    const BarChart = ({ data, dataKey, color, label }: { data: PerformanceData[], dataKey: 'cases' | 'tickets', color: string, label: string }) => {
        const maxValue = Math.max(...data.map(d => d[dataKey]));
        return (
            <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{label}</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px' }}>
                    {data.map((d, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div
                                style={{
                                    width: '100%',
                                    height: `${(d[dataKey] / maxValue) * 80}px`,
                                    background: color,
                                    borderRadius: '4px 4px 0 0',
                                    transition: 'height 0.3s ease',
                                }}
                                title={`${d.date}: ${d[dataKey]}`}
                            />
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                {new Date(d.date).toLocaleDateString('en', { weekday: 'short' })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
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

    const renderOverviewTab = () => (
        <>
            {/* Stats Grid */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
                <div className="stat-card">
                    <div className="stat-label"><span className="stat-icon">👥</span> Total Staff</div>
                    <div className="stat-value">{metrics?.totalStaff || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label"><span className="stat-icon" style={{ color: '#3fb950' }}>●</span> Online Now</div>
                    <div className="stat-value" style={{ color: '#3fb950' }}>{metrics?.onlineNow || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label"><span className="stat-icon">⏱</span> Avg Response</div>
                    <div className="stat-value">{metrics?.avgResponseTime || 0}m</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label"><span className="stat-icon">☰</span> Cases Today</div>
                    <div className="stat-value">{metrics?.casesToday || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label"><span className="stat-icon">✉</span> Tickets Today</div>
                    <div className="stat-value">{metrics?.ticketsToday || 0}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label"><span className="stat-icon">⭐</span> Satisfaction</div>
                    <div className="stat-value" style={{ color: '#3fb950' }}>{metrics?.satisfactionRate || 0}%</div>
                </div>
            </div>

            {/* Main content grid */}
            <div className="content-grid">
                {/* Online Staff */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">🟢 Online Staff</h3>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{staff.filter(s => s.status === 'online').length} active</span>
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {staff.filter(s => s.status === 'online' || s.status === 'away' || s.status === 'busy').map(member => (
                            <div key={member.id} className="case-item">
                                <div className="case-left">
                                    <div style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        background: 'var(--bg-elevated)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '14px',
                                        position: 'relative',
                                    }}>
                                        👤
                                        <span style={{
                                            position: 'absolute',
                                            bottom: '0',
                                            right: '0',
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '50%',
                                            background: getStatusColor(member.status),
                                            border: '2px solid var(--bg-secondary)',
                                        }} />
                                    </div>
                                    <div className="case-info">
                                        <h4>{member.displayName}</h4>
                                        <p style={{ fontSize: '12px' }}>{member.role}</p>
                                    </div>
                                </div>
                                <div className="case-right">
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{member.department}</div>
                                </div>
                            </div>
                        ))}
                        {staff.filter(s => s.status !== 'offline').length === 0 && (
                            <div className="empty-state">No staff online</div>
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">📋 Recent Activity</h3>
                        <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={() => setActiveTab('activity')}>
                            View All
                        </button>
                    </div>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {activities.slice(0, 6).map(activity => (
                            <div key={activity.id} className="case-item">
                                <div className="case-left">
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: getActionTypeColor(activity.type),
                                    }} />
                                    <div className="case-info" style={{ marginLeft: '12px' }}>
                                        <h4 style={{ fontSize: '13px' }}>{activity.staffName}</h4>
                                        <p style={{ fontSize: '12px' }}>{activity.action} - {activity.target}</p>
                                    </div>
                                </div>
                                <div className="case-right">
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatTimeAgo(activity.timestamp)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Performance Charts */}
            <div className="content-grid" style={{ marginTop: 'var(--spacing-lg)' }}>
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">📊 Cases (7 Days)</h3>
                    </div>
                    <div style={{ padding: 'var(--spacing-md)' }}>
                        <BarChart data={performanceData} dataKey="cases" color="var(--action-warn)" label="Daily case volume" />
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">🎫 Tickets (7 Days)</h3>
                    </div>
                    <div style={{ padding: 'var(--spacing-md)' }}>
                        <BarChart data={performanceData} dataKey="tickets" color="var(--accent-primary)" label="Daily ticket volume" />
                    </div>
                </div>
            </div>
        </>
    );

    const renderStaffTab = () => (
        <>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
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
                    value={filterDepartment}
                    onChange={e => setFilterDepartment(e.target.value)}
                    style={{ width: '160px' }}
                >
                    <option value="all">All Departments</option>
                    {departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
                <select
                    className="form-input"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    style={{ width: '140px' }}
                >
                    <option value="all">All Status</option>
                    <option value="online">Online</option>
                    <option value="away">Away</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                </select>
            </div>

            {/* Staff Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">👥 Staff Directory ({filteredStaff.length})</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Staff Member</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Role</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Department</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Cases</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Tickets</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Avg Time</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Rating</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStaff.map(member => (
                                <tr key={member.id} style={{ borderBottom: '1px solid var(--border-muted)' }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
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
                                                <div style={{ fontWeight: 500 }}>{member.displayName}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{member.role}</td>
                                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{member.department}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            background: `${getStatusColor(member.status)}20`,
                                            color: getStatusColor(member.status),
                                            fontSize: '12px',
                                            fontWeight: 500,
                                        }}>
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: getStatusColor(member.status) }} />
                                            {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>{member.casesHandled}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>{member.ticketsResolved}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent-primary)' }}>{member.avgResponseTime}m</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <span style={{ color: '#d29922' }}>★</span> {member.rating.toFixed(1)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredStaff.length === 0 && (
                    <div className="empty-state">No staff members match your filters</div>
                )}
            </div>
        </>
    );

    const renderActivityTab = () => (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">📋 Activity Log</h3>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 12px' }}>Export</button>
                </div>
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {activities.map(activity => (
                    <div key={activity.id} className="case-item">
                        <div className="case-left">
                            <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: `${getActionTypeColor(activity.type)}20`,
                                color: getActionTypeColor(activity.type),
                                fontSize: '11px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                            }}>
                                {activity.type}
                            </span>
                            <div className="case-info" style={{ marginLeft: '12px' }}>
                                <h4>{activity.staffName}</h4>
                                <p>{activity.action} - <span style={{ color: 'var(--accent-primary)' }}>{activity.target}</span></p>
                            </div>
                        </div>
                        <div className="case-right">
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {new Date(activity.timestamp).toLocaleString()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAnalyticsTab = () => (
        <>
            {/* Time range selector */}
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                {(['7d', '30d', '90d'] as const).map(range => (
                    <button
                        key={range}
                        className={`btn ${timeRange === range ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setTimeRange(range)}
                        style={{ padding: '6px 16px' }}
                    >
                        {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                    </button>
                ))}
            </div>

            {/* Analytics cards */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-card">
                    <div className="stat-label">Total Cases</div>
                    <div className="stat-value">{performanceData.reduce((sum, d) => sum + d.cases, 0)}</div>
                    <div style={{ fontSize: '12px', color: '#3fb950', marginTop: '4px' }}>↑ 12% vs prev period</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Total Tickets</div>
                    <div className="stat-value">{performanceData.reduce((sum, d) => sum + d.tickets, 0)}</div>
                    <div style={{ fontSize: '12px', color: '#3fb950', marginTop: '4px' }}>↑ 8% vs prev period</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Avg Response Time</div>
                    <div className="stat-value">{(performanceData.reduce((sum, d) => sum + d.avgTime, 0) / performanceData.length).toFixed(1)}m</div>
                    <div style={{ fontSize: '12px', color: '#3fb950', marginTop: '4px' }}>↓ 15% faster</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Resolution Rate</div>
                    <div className="stat-value">94.2%</div>
                    <div style={{ fontSize: '12px', color: '#3fb950', marginTop: '4px' }}>↑ 2.3% improvement</div>
                </div>
            </div>

            {/* Charts grid */}
            <div className="content-grid" style={{ marginTop: 'var(--spacing-lg)' }}>
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">📈 Cases Trend</h3>
                    </div>
                    <div style={{ padding: 'var(--spacing-lg)' }}>
                        <BarChart data={performanceData} dataKey="cases" color="var(--action-warn)" label="Cases handled per day" />
                    </div>
                </div>
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">📈 Tickets Trend</h3>
                    </div>
                    <div style={{ padding: 'var(--spacing-lg)' }}>
                        <BarChart data={performanceData} dataKey="tickets" color="var(--accent-primary)" label="Tickets resolved per day" />
                    </div>
                </div>
            </div>

            {/* Top performers */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <div className="card-header">
                    <h3 className="card-title">🏆 Top Performers</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)', padding: 'var(--spacing-lg)' }}>
                    {staff.sort((a, b) => (b.casesHandled + b.ticketsResolved) - (a.casesHandled + a.ticketsResolved)).slice(0, 3).map((member, i) => (
                        <div key={member.id} style={{
                            padding: 'var(--spacing-lg)',
                            background: 'var(--bg-elevated)',
                            borderRadius: 'var(--radius-lg)',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                                {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                            </div>
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{member.displayName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{member.role}</div>
                            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--accent-primary)' }}>
                                {member.casesHandled + member.ticketsResolved}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>total actions</div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );

    const renderSettingsTab = () => (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">⚙️ Supervisor Settings</h3>
            </div>
            <div style={{ padding: 'var(--spacing-lg)' }}>
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <label className="form-label">Notification Preferences</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked /> Notify on new escalations
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked /> Notify when staff goes offline
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" /> Daily summary email
                        </label>
                    </div>
                </div>
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <label className="form-label">Default Time Range</label>
                    <select className="form-input" style={{ width: '200px' }}>
                        <option value="7d">7 Days</option>
                        <option value="30d">30 Days</option>
                        <option value="90d">90 Days</option>
                    </select>
                </div>
                <button className="btn btn-primary">Save Settings</button>
            </div>
        </div>
    );

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div>
                    <div className="page-header">
                        <h1 className="page-title">Supervisor Dashboard</h1>
                        <p className="page-subtitle">Monitor staff performance and team activity</p>
                    </div>

                    {/* Tab Navigation */}
                    <div style={{
                        display: 'flex',
                        gap: 'var(--spacing-xs)',
                        marginBottom: 'var(--spacing-lg)',
                        borderBottom: '1px solid var(--border-default)',
                        paddingBottom: 'var(--spacing-sm)',
                    }}>
                        {(['overview', 'staff', 'activity', 'analytics', 'settings'] as TabType[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    padding: '8px 16px',
                                    background: activeTab === tab ? 'var(--bg-elevated)' : 'transparent',
                                    border: 'none',
                                    borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                                    color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontWeight: activeTab === tab ? 600 : 400,
                                    transition: 'all 0.15s',
                                }}
                            >
                                {tab === 'overview' && '📊 '}
                                {tab === 'staff' && '👥 '}
                                {tab === 'activity' && '📋 '}
                                {tab === 'analytics' && '📈 '}
                                {tab === 'settings' && '⚙️ '}
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="empty-state">Loading supervisor data...</div>
                    ) : (
                        <>
                            {activeTab === 'overview' && renderOverviewTab()}
                            {activeTab === 'staff' && renderStaffTab()}
                            {activeTab === 'activity' && renderActivityTab()}
                            {activeTab === 'analytics' && renderAnalyticsTab()}
                            {activeTab === 'settings' && renderSettingsTab()}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
