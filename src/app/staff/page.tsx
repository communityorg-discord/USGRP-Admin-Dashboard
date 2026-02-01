'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSession } from '@/hooks/useSession';

// Types
interface StaffAccount {
    id: string;
    email: string;
    discordId: string | null;
    displayName: string;
    authorityLevel: number;
    authorityLabel: string;
    roles: string[];
    permissions: string[];
    enabled: boolean;
    suspended: boolean;
    totpEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}

interface ActivityStats {
    messagers: Array<{ username: string; count: number }>;
    voice: Array<{ username: string; minutes: number }>;
}

type TabType = 'accounts' | 'performance' | 'wellbeing' | 'activity';

// Icons
const Icons = {
    Users: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    Activity: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
    ),
    Heart: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
    ),
    BarChart: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    ),
    Shield: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    ExternalLink: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
    ),
};

export default function StaffPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [activeTab, setActiveTab] = useState<TabType>('accounts');
    
    // Data states
    const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
    const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, admins: 0, mfaEnabled: 0 });

    useEffect(() => {
        if (session) {
            loadData();
        }
    }, [session, activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case 'accounts':
                    const accountsRes = await fetch('/api/staff/accounts');
                    if (accountsRes.ok) {
                        const data = await accountsRes.json();
                        setStaffAccounts(data.accounts || []);
                        setStats(data.stats || { total: 0, admins: 0, mfaEnabled: 0 });
                    }
                    break;
                case 'activity':
                    const activityRes = await fetch('/api/bot/activity/top');
                    if (activityRes.ok) setActivityStats(await activityRes.json());
                    break;
            }
        } catch (e) {
            console.error('Failed to load data:', e);
        }
        setLoading(false);
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

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'accounts', label: 'Accounts', icon: <Icons.Users /> },
        { id: 'performance', label: 'Performance', icon: <Icons.Activity /> },
        { id: 'wellbeing', label: 'Wellbeing', icon: <Icons.Heart /> },
        { id: 'activity', label: 'Activity', icon: <Icons.BarChart /> },
    ];

    const getAuthorityColor = (level: number) => {
        if (level >= 6) return '#f59e0b'; // Developer
        if (level >= 5) return '#ef4444'; // Superuser
        if (level >= 3) return '#3b82f6'; // Admin
        if (level >= 2) return '#8b5cf6'; // Mod
        return '#64748b';
    };

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div>
                    {/* Header */}
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">Staff Management</h1>
                            <p className="page-subtitle">Manage staff accounts, performance, and wellbeing</p>
                        </div>
                        <a 
                            href="https://auth.usgrp.xyz/dashboard/users" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="auth-link"
                        >
                            <Icons.ExternalLink />
                            Manage in Auth Portal
                        </a>
                    </div>

                    {/* Stats */}
                    {activeTab === 'accounts' && (
                        <div className="stats-row">
                            <div className="stat-item">
                                <span className="stat-value">{stats.total}</span>
                                <span className="stat-label">Total Accounts</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{stats.admins}</span>
                                <span className="stat-label">Admins+</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{stats.mfaEnabled}</span>
                                <span className="stat-label">MFA Enabled</span>
                            </div>
                        </div>
                    )}

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
                                {/* Accounts Tab */}
                                {activeTab === 'accounts' && (
                                    <div className="card">
                                        <div className="card-header">
                                            <h3 className="card-title">Auth System Accounts</h3>
                                        </div>
                                        {staffAccounts.length > 0 ? (
                                            <div className="staff-list">
                                                {staffAccounts.map(staff => (
                                                    <div key={staff.id} className="staff-item">
                                                        <div className="staff-avatar" style={{ background: `linear-gradient(135deg, ${getAuthorityColor(staff.authorityLevel)}, ${getAuthorityColor(staff.authorityLevel)}88)` }}>
                                                            {staff.displayName?.[0]?.toUpperCase() || 'S'}
                                                        </div>
                                                        <div className="staff-info">
                                                            <span className="staff-name">{staff.displayName}</span>
                                                            <span className="staff-email">{staff.email}</span>
                                                        </div>
                                                        <div className="staff-badges">
                                                            <span 
                                                                className="authority-badge"
                                                                style={{ 
                                                                    background: `${getAuthorityColor(staff.authorityLevel)}20`,
                                                                    color: getAuthorityColor(staff.authorityLevel),
                                                                    borderColor: `${getAuthorityColor(staff.authorityLevel)}40`
                                                                }}
                                                            >
                                                                {staff.authorityLabel}
                                                            </span>
                                                            {staff.totpEnabled && (
                                                                <span className="mfa-badge" title="MFA Enabled">
                                                                    <Icons.Shield />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="staff-meta">
                                                            {staff.discordId && (
                                                                <span className="staff-id">{staff.discordId}</span>
                                                            )}
                                                            <span className="staff-date">
                                                                Joined {new Date(staff.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="empty-state">
                                                <p>No staff accounts found</p>
                                                <span>Create accounts in the Auth Portal</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Performance Tab */}
                                {activeTab === 'performance' && (
                                    <div className="card">
                                        <div className="card-header">
                                            <h3 className="card-title">Staff Performance</h3>
                                        </div>
                                        <div className="empty-state">
                                            <p>Performance tracking coming soon</p>
                                            <span>Track cases handled, response times, and ratings</span>
                                        </div>
                                    </div>
                                )}

                                {/* Wellbeing Tab */}
                                {activeTab === 'wellbeing' && (
                                    <div className="card">
                                        <div className="card-header">
                                            <h3 className="card-title">Staff Wellbeing</h3>
                                        </div>
                                        <div className="empty-state">
                                            <p>Wellbeing tracking coming soon</p>
                                            <span>Monitor staff wellness and schedule check-ins</span>
                                        </div>
                                    </div>
                                )}

                                {/* Activity Tab */}
                                {activeTab === 'activity' && (
                                    <div className="content-grid">
                                        <div className="card">
                                            <div className="card-header">
                                                <h3 className="card-title">Top Messagers (30d)</h3>
                                            </div>
                                            {activityStats?.messagers && activityStats.messagers.length > 0 ? (
                                                <div className="leaderboard">
                                                    {activityStats.messagers.slice(0, 10).map((user, i) => (
                                                        <div key={i} className="leaderboard-item">
                                                            <span className={`rank ${i < 3 ? 'top' : ''}`}>#{i + 1}</span>
                                                            <span className="username">{user.username}</span>
                                                            <span className="value">{user.count.toLocaleString()} msgs</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="empty-state">No activity data</div>
                                            )}
                                        </div>

                                        <div className="card">
                                            <div className="card-header">
                                                <h3 className="card-title">Top Voice (30d)</h3>
                                            </div>
                                            {activityStats?.voice && activityStats.voice.length > 0 ? (
                                                <div className="leaderboard">
                                                    {activityStats.voice.slice(0, 10).map((user, i) => (
                                                        <div key={i} className="leaderboard-item">
                                                            <span className={`rank ${i < 3 ? 'top' : ''}`}>#{i + 1}</span>
                                                            <span className="username">{user.username}</span>
                                                            <span className="value">{Math.round(user.minutes / 60)}h {user.minutes % 60}m</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="empty-state">No voice data</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>

            <style jsx>{`
                .page-header {
                    margin-bottom: 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
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

                .auth-link {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    background: var(--bg-elevated);
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    color: var(--text-secondary);
                    text-decoration: none;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.15s;
                }

                .auth-link:hover {
                    background: var(--bg-hover);
                    border-color: var(--border-hover);
                    color: var(--text-primary);
                }

                .auth-link :global(svg) {
                    width: 16px;
                    height: 16px;
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

                .tab-content {
                    min-height: 400px;
                }

                .staff-list {
                    display: flex;
                    flex-direction: column;
                }

                .staff-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 24px;
                    border-bottom: 1px solid var(--border-subtle);
                    transition: background 0.1s;
                }

                .staff-item:last-child {
                    border-bottom: none;
                }

                .staff-item:hover {
                    background: var(--bg-hover);
                }

                .staff-avatar {
                    width: 44px;
                    height: 44px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    color: white;
                    font-size: 18px;
                    flex-shrink: 0;
                }

                .staff-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 0;
                }

                .staff-name {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .staff-email {
                    font-size: 13px;
                    color: var(--text-muted);
                }

                .staff-badges {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .authority-badge {
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    border: 1px solid;
                }

                .mfa-badge {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #10b981;
                }

                .mfa-badge :global(svg) {
                    width: 16px;
                    height: 16px;
                }

                .staff-meta {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 2px;
                    min-width: 150px;
                }

                .staff-id {
                    font-size: 12px;
                    font-family: var(--font-mono);
                    color: var(--text-muted);
                }

                .staff-date {
                    font-size: 12px;
                    color: var(--text-dim);
                }

                .leaderboard {
                    display: flex;
                    flex-direction: column;
                }

                .leaderboard-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 12px 24px;
                    border-bottom: 1px solid var(--border-subtle);
                }

                .leaderboard-item:last-child {
                    border-bottom: none;
                }

                .rank {
                    width: 32px;
                    font-weight: 700;
                    color: var(--text-muted);
                }

                .rank.top {
                    color: #f59e0b;
                }

                .username {
                    flex: 1;
                    font-size: 14px;
                    color: var(--text-primary);
                }

                .value {
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--accent-blue);
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

                .content-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                }

                @media (max-width: 900px) {
                    .content-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .page-header {
                        flex-direction: column;
                        gap: 16px;
                    }
                }
            `}</style>
        </div>
    );
}
