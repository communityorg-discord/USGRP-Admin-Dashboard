'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSession } from '@/hooks/useSession';

interface ActivityData {
    topMessagers: Array<{ user_id: string; total: number }>;
    topVoice: Array<{ user_id: string; total: number }>;
    trends: Array<{ date: string; messages: number; voice: number }>;
}

interface StaffData {
    staff: Array<{
        moderatorId: string;
        moderatorTag: string;
        totalCases: number;
        warns: number;
        mutes: number;
        kicks: number;
        bans: number;
        last7Days: number;
        last30Days: number;
    }>;
    overall: { total: number; today: number; week: number; month: number };
    actionBreakdown: Record<string, number>;
    dailyCases: Array<{ date: string; count: number }>;
}

// Simple bar chart component
function BarChart({ data, label, color }: { data: Array<{ date: string; value: number }>; label: string; color: string }) {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    return (
        <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '120px' }}>
                {data.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div 
                            style={{ 
                                width: '100%', 
                                maxWidth: '24px',
                                height: `${(d.value / maxValue) * 100}px`,
                                background: color,
                                borderRadius: '3px 3px 0 0',
                                minHeight: '2px',
                                transition: 'height 0.3s ease',
                            }} 
                            title={`${d.date}: ${d.value}`}
                        />
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', color: 'var(--text-muted)' }}>
                <span>{data[0]?.date.slice(5)}</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                <span>{data[data.length - 1]?.date.slice(5)}</span>
            </div>
        </div>
    );
}

// Donut chart for action breakdown
function DonutChart({ data }: { data: Record<string, number> }) {
    const colors: Record<string, string> = {
        warn: '#f59e0b',
        mute: '#3b82f6',
        kick: '#8b5cf6',
        ban: '#ef4444',
    };
    
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) return <div className="empty-state">No data</div>;
    
    let cumulative = 0;
    const segments = Object.entries(data).map(([type, count]) => {
        const percentage = (count / total) * 100;
        const startAngle = cumulative * 3.6;
        cumulative += percentage;
        return { type, count, percentage, startAngle, color: colors[type] || '#6b7280' };
    });
    
    return (
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                    {segments.map((seg, i) => (
                        <circle
                            key={i}
                            cx="18" cy="18" r="15.915"
                            fill="transparent"
                            stroke={seg.color}
                            strokeWidth="3"
                            strokeDasharray={`${seg.percentage} ${100 - seg.percentage}`}
                            strokeDashoffset={-segments.slice(0, i).reduce((acc, s) => acc + s.percentage, 0)}
                        />
                    ))}
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <span style={{ fontSize: '18px', fontWeight: 600 }}>{total}</span>
                    <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>TOTAL</span>
                </div>
            </div>
            <div style={{ flex: 1 }}>
                {segments.map((seg) => (
                    <div key={seg.type} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: seg.color }} />
                        <span style={{ flex: 1, fontSize: '13px', textTransform: 'capitalize' }}>{seg.type}</span>
                        <span style={{ fontWeight: 500 }}>{seg.count}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({seg.percentage.toFixed(0)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AnalyticsPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [activity, setActivity] = useState<ActivityData | null>(null);
    const [staffData, setStaffData] = useState<StaffData | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'activity'>('overview');

    useEffect(() => {
        if (session) {
            fetch('/api/analytics/activity').then(r => r.ok ? r.json() : null).then(setActivity).catch(() => {});
            fetch('/api/analytics/staff').then(r => r.ok ? r.json() : null).then(setStaffData).catch(() => {});
        }
    }, [session]);

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
                    <div className="page-header">
                        <h1 className="page-title">Analytics</h1>
                        <p className="page-subtitle">Server activity, moderation stats, and staff performance</p>
                    </div>

                    {/* Tab Navigation */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                        {(['overview', 'staff', 'activity'] as const).map(tab => (
                            <button
                                key={tab}
                                className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setActiveTab(tab)}
                                style={{ textTransform: 'capitalize' }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'overview' && (
                        <>
                            {/* Quick Stats */}
                            <section className="stats-grid" style={{ marginBottom: '24px' }}>
                                <div className="stat-card">
                                    <div className="stat-label"><span className="stat-icon">📋</span> Total Cases</div>
                                    <div className="stat-value">{staffData?.overall.total.toLocaleString() || '0'}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label"><span className="stat-icon">📅</span> Today</div>
                                    <div className="stat-value">{staffData?.overall.today || '0'}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label"><span className="stat-icon">📆</span> This Week</div>
                                    <div className="stat-value">{staffData?.overall.week || '0'}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label"><span className="stat-icon">📊</span> This Month</div>
                                    <div className="stat-value">{staffData?.overall.month || '0'}</div>
                                </div>
                            </section>

                            <section className="content-grid">
                                {/* Cases Chart */}
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">📈 Cases (14 Days)</h3>
                                    </div>
                                    {staffData?.dailyCases && staffData.dailyCases.length > 0 ? (
                                        <BarChart 
                                            data={staffData.dailyCases.map(d => ({ date: d.date, value: d.count }))} 
                                            label="Daily Cases" 
                                            color="#3b82f6" 
                                        />
                                    ) : (
                                        <div className="empty-state">No case data</div>
                                    )}
                                </div>

                                {/* Action Breakdown */}
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">🥧 Action Breakdown (30 Days)</h3>
                                    </div>
                                    {staffData?.actionBreakdown ? (
                                        <DonutChart data={staffData.actionBreakdown} />
                                    ) : (
                                        <div className="empty-state">No data</div>
                                    )}
                                </div>
                            </section>

                            {/* Message Trends */}
                            {activity?.trends && activity.trends.length > 0 && (
                                <section className="content-grid" style={{ marginTop: '24px' }}>
                                    <div className="card">
                                        <div className="card-header">
                                            <h3 className="card-title">💬 Messages (14 Days)</h3>
                                        </div>
                                        <BarChart 
                                            data={activity.trends.map(d => ({ date: d.date, value: d.messages }))} 
                                            label="Daily Messages" 
                                            color="#10b981" 
                                        />
                                    </div>
                                    <div className="card">
                                        <div className="card-header">
                                            <h3 className="card-title">🎙️ Voice Minutes (14 Days)</h3>
                                        </div>
                                        <BarChart 
                                            data={activity.trends.map(d => ({ date: d.date, value: d.voice }))} 
                                            label="Daily Voice" 
                                            color="#8b5cf6" 
                                        />
                                    </div>
                                </section>
                            )}
                        </>
                    )}

                    {activeTab === 'staff' && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">👮 Staff Performance</h3>
                            </div>
                            {staffData?.staff && staffData.staff.length > 0 ? (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Moderator</th>
                                                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Total</th>
                                                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '11px', fontWeight: 600, color: '#f59e0b' }}>Warns</th>
                                                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '11px', fontWeight: 600, color: '#3b82f6' }}>Mutes</th>
                                                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '11px', fontWeight: 600, color: '#8b5cf6' }}>Kicks</th>
                                                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '11px', fontWeight: 600, color: '#ef4444' }}>Bans</th>
                                                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>7d</th>
                                                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>30d</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {staffData.staff.map((s, i) => (
                                                <tr key={s.moderatorId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontWeight: 600, color: i < 3 ? '#f59e0b' : 'var(--text-muted)', minWidth: '20px' }}>#{i + 1}</span>
                                                            <span style={{ fontWeight: 500 }}>{s.moderatorTag}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'center', padding: '12px 8px', fontWeight: 600 }}>{s.totalCases}</td>
                                                    <td style={{ textAlign: 'center', padding: '12px 8px', color: '#f59e0b' }}>{s.warns}</td>
                                                    <td style={{ textAlign: 'center', padding: '12px 8px', color: '#3b82f6' }}>{s.mutes}</td>
                                                    <td style={{ textAlign: 'center', padding: '12px 8px', color: '#8b5cf6' }}>{s.kicks}</td>
                                                    <td style={{ textAlign: 'center', padding: '12px 8px', color: '#ef4444' }}>{s.bans}</td>
                                                    <td style={{ textAlign: 'center', padding: '12px 8px', color: 'var(--text-secondary)' }}>{s.last7Days}</td>
                                                    <td style={{ textAlign: 'center', padding: '12px 8px', color: 'var(--text-secondary)' }}>{s.last30Days}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="empty-state">No staff data available</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'activity' && (
                        <section className="content-grid">
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">💬 Top Messagers (30d)</h3>
                                </div>
                                {activity?.topMessagers && activity.topMessagers.length > 0 ? (
                                    <div>
                                        {activity.topMessagers.slice(0, 10).map((u, i) => (
                                            <div key={i} className="case-item" style={{ padding: '12px 16px' }}>
                                                <div className="case-left">
                                                    <span style={{ fontWeight: 600, color: i < 3 ? '#f59e0b' : 'var(--text-muted)', minWidth: '24px' }}>#{i + 1}</span>
                                                    <span style={{ marginLeft: '12px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{u.user_id}</span>
                                                </div>
                                                <div className="case-right">
                                                    <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>{u.total.toLocaleString()} msgs</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">No message data</div>
                                )}
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">🎙️ Top Voice Users (30d)</h3>
                                </div>
                                {activity?.topVoice && activity.topVoice.length > 0 ? (
                                    <div>
                                        {activity.topVoice.slice(0, 10).map((u, i) => (
                                            <div key={i} className="case-item" style={{ padding: '12px 16px' }}>
                                                <div className="case-left">
                                                    <span style={{ fontWeight: 600, color: i < 3 ? '#f59e0b' : 'var(--text-muted)', minWidth: '24px' }}>#{i + 1}</span>
                                                    <span style={{ marginLeft: '12px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{u.user_id}</span>
                                                </div>
                                                <div className="case-right">
                                                    <span style={{ color: '#8b5cf6', fontWeight: 500 }}>{u.total.toLocaleString()} mins</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">No voice data</div>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}
