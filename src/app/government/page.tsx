'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSession } from '@/hooks/useSession';

interface Official {
    id: number;
    govId: string;
    discordId: string;
    displayName: string;
    citizenId: string;
    position: string;
    positionKey: string;
    status: string;
    registeredAt: string;
    termStart: string;
    termEnd: string;
}

interface Stats {
    total: number;
    executive: number;
    cabinet: number;
    other: number;
}

export default function GovernmentPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [officials, setOfficials] = useState<Official[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, executive: 0, cabinet: 0, other: 0 });
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('all');

    const tabs = ['All', 'Executive', 'Cabinet', 'Other'];

    useEffect(() => {
        if (session) {
            fetchData();
        }
    }, [session]);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/bot/government');
            if (res.ok) {
                const data = await res.json();
                setOfficials(data.officials || []);
                setStats(data.stats || { total: 0, executive: 0, cabinet: 0, other: 0 });
                setLastUpdated(data.lastUpdated);
            }
        } catch (e) {
            console.error('Failed to fetch government data:', e);
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

    const getFilteredOfficials = () => {
        switch (activeTab) {
            case 'Executive':
                return officials.filter(o => 
                    ['president', 'vicePresident', 'whiteHouseChiefOfStaff'].includes(o.positionKey) ||
                    o.positionKey?.startsWith('wh')
                );
            case 'Cabinet':
                return officials.filter(o => o.positionKey?.startsWith('secretaryOf'));
            case 'Other':
                return officials.filter(o => 
                    !['president', 'vicePresident', 'whiteHouseChiefOfStaff'].includes(o.positionKey) &&
                    !o.positionKey?.startsWith('wh') &&
                    !o.positionKey?.startsWith('secretaryOf')
                );
            default:
                return officials;
        }
    };

    const filteredOfficials = getFilteredOfficials();

    const getPositionColor = (positionKey: string) => {
        if (positionKey === 'president') return '#f59e0b';
        if (positionKey === 'vicePresident') return '#8b5cf6';
        if (positionKey === 'whiteHouseChiefOfStaff') return '#3b82f6';
        if (positionKey?.startsWith('secretaryOf')) return '#10b981';
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
                            <h1 className="page-title">Government</h1>
                            <p className="page-subtitle">
                                Current government officials and positions
                                {lastUpdated && <span className="last-updated"> · Updated {new Date(lastUpdated).toLocaleTimeString()}</span>}
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="stats-row">
                        <div className="stat-item">
                            <span className="stat-value">{stats.total}</span>
                            <span className="stat-label">Total Officials</span>
                        </div>
                        <div className="stat-item executive">
                            <span className="stat-value">{stats.executive}</span>
                            <span className="stat-label">Executive</span>
                        </div>
                        <div className="stat-item cabinet">
                            <span className="stat-value">{stats.cabinet}</span>
                            <span className="stat-label">Cabinet</span>
                        </div>
                        <div className="stat-item other">
                            <span className="stat-value">{stats.other}</span>
                            <span className="stat-label">Other</span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="tabs-container">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                                <span className="tab-count">
                                    {tab === 'All' ? stats.total : 
                                     tab === 'Executive' ? stats.executive :
                                     tab === 'Cabinet' ? stats.cabinet : stats.other}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Officials List */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">{activeTab === 'All' ? 'All Officials' : activeTab}</h3>
                        </div>
                        {loading ? (
                            <div className="empty-state">Loading officials...</div>
                        ) : filteredOfficials.length > 0 ? (
                            <div className="officials-list">
                                {filteredOfficials.map(official => (
                                    <div key={official.id} className="official-row">
                                        <div className="official-avatar" style={{ 
                                            background: `linear-gradient(135deg, ${getPositionColor(official.positionKey)}, ${getPositionColor(official.positionKey)}88)` 
                                        }}>
                                            {official.displayName?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="official-info">
                                            <span className="official-name">{official.displayName}</span>
                                            <span className="official-position">{official.position}</span>
                                        </div>
                                        <div className="official-meta">
                                            <span className="gov-id">{official.govId}</span>
                                            <span className="citizen-id">{official.citizenId}</span>
                                        </div>
                                        <div className="official-dates">
                                            <span className="date-label">Since</span>
                                            <span className="date-value">
                                                {new Date(official.registeredAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No officials found in this category</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

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

                .last-updated {
                    font-size: 13px;
                    color: var(--text-dim);
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
                    flex: 1;
                }

                .stat-item.executive {
                    border-left: 3px solid #f59e0b;
                }

                .stat-item.cabinet {
                    border-left: 3px solid #10b981;
                }

                .stat-item.other {
                    border-left: 3px solid #64748b;
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

                .tab-count {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 11px;
                    font-weight: 700;
                }

                .tab-btn.active .tab-count {
                    background: rgba(96, 165, 250, 0.2);
                }

                .officials-list {
                    display: flex;
                    flex-direction: column;
                }

                .official-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 24px;
                    border-bottom: 1px solid var(--border-subtle);
                    transition: background 0.1s;
                }

                .official-row:last-child {
                    border-bottom: none;
                }

                .official-row:hover {
                    background: var(--bg-hover);
                }

                .official-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    font-weight: 700;
                    color: white;
                    flex-shrink: 0;
                }

                .official-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 0;
                }

                .official-name {
                    font-size: 15px;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .official-position {
                    font-size: 13px;
                    color: var(--text-muted);
                }

                .official-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 180px;
                }

                .gov-id {
                    font-size: 12px;
                    font-family: var(--font-mono);
                    color: var(--accent-blue);
                }

                .citizen-id {
                    font-size: 11px;
                    font-family: var(--font-mono);
                    color: var(--text-dim);
                }

                .official-dates {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 2px;
                    min-width: 100px;
                }

                .date-label {
                    font-size: 10px;
                    color: var(--text-dim);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .date-value {
                    font-size: 13px;
                    color: var(--text-secondary);
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

                @media (max-width: 900px) {
                    .stats-row {
                        flex-wrap: wrap;
                    }
                    
                    .stat-item {
                        min-width: calc(50% - 8px);
                    }

                    .official-meta,
                    .official-dates {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
}
