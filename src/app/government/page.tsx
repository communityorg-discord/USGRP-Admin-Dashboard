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
    // Extended citizen data
    citizen?: {
        name: string;
        age: number;
        state: string;
        education: string;
        balance: number;
        checkingBalance: number;
        savingsBalance: number;
        creditScore: number;
        netWorth: number;
        salary: number;
        employer: string;
        housing: any;
        criminalRecord: number;
        arrests: number;
        taxesPaid: number;
        createdAt: string;
    };
}

interface Stats {
    total: number;
    executive: number;
    cabinet: number;
    other: number;
}

const Icons = {
    X: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    Copy: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
    ),
    User: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    ),
    Briefcase: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    ),
    DollarSign: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    ),
    Home: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
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

export default function GovernmentPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [officials, setOfficials] = useState<Official[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, executive: 0, cabinet: 0, other: 0 });
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('All');
    const [selectedOfficial, setSelectedOfficial] = useState<Official | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const tabs = ['All', 'Executive', 'Cabinet', 'Other'];

    useEffect(() => {
        if (session) fetchData();
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

    const openOfficialModal = async (official: Official) => {
        setSelectedOfficial(official);
        setLoadingDetails(true);

        // Fetch extended citizen data
        try {
            const res = await fetch(`/api/bot/government/${official.discordId}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedOfficial({ ...official, citizen: data.citizen });
            }
        } catch (e) {
            console.error('Failed to fetch citizen details:', e);
        }
        setLoadingDetails(false);
    };

    const closeModal = () => {
        setSelectedOfficial(null);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
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
        if (positionKey?.includes('director') || positionKey?.includes('Director')) return '#06b6d4';
        return '#64748b';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div>
                    {/* Header */}
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">Government Officials</h1>
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

                    {/* Officials Grid */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">{activeTab === 'All' ? 'All Officials' : activeTab}</h3>
                            <span className="card-count">{filteredOfficials.length} officials</span>
                        </div>
                        {loading ? (
                            <div className="empty-state">Loading officials...</div>
                        ) : filteredOfficials.length > 0 ? (
                            <div className="officials-grid">
                                {filteredOfficials.map(official => (
                                    <div 
                                        key={official.id} 
                                        className="official-card"
                                        onClick={() => openOfficialModal(official)}
                                    >
                                        <div className="official-avatar" style={{ 
                                            background: `linear-gradient(135deg, ${getPositionColor(official.positionKey)}, ${getPositionColor(official.positionKey)}88)` 
                                        }}>
                                            {official.displayName?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="official-info">
                                            <span className="official-name">{official.displayName}</span>
                                            <span className="official-position">{official.position}</span>
                                        </div>
                                        <div className="official-ids">
                                            <code className="gov-id">{official.govId}</code>
                                        </div>
                                        <div className="official-date">
                                            Since {new Date(official.registeredAt).toLocaleDateString()}
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

            {/* Official Detail Modal */}
            {selectedOfficial && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title-row">
                                <div className="modal-avatar" style={{ 
                                    background: `linear-gradient(135deg, ${getPositionColor(selectedOfficial.positionKey)}, ${getPositionColor(selectedOfficial.positionKey)}88)` 
                                }}>
                                    {selectedOfficial.displayName?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h2>{selectedOfficial.displayName}</h2>
                                    <span className="modal-position">{selectedOfficial.position}</span>
                                </div>
                            </div>
                            <button className="modal-close" onClick={closeModal}><Icons.X /></button>
                        </div>

                        <div className="modal-body">
                            {loadingDetails ? (
                                <div className="loading-details">Loading citizen data...</div>
                            ) : (
                                <div className="detail-sections">
                                    {/* Government Info */}
                                    <div className="detail-section">
                                        <div className="section-header">
                                            <Icons.Briefcase />
                                            <h4>Government Position</h4>
                                        </div>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <span className="detail-label">Government ID</span>
                                                <span className="detail-value mono">
                                                    {selectedOfficial.govId}
                                                    <button className="copy-btn" onClick={() => copyToClipboard(selectedOfficial.govId)}><Icons.Copy /></button>
                                                </span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Position</span>
                                                <span className="detail-value">{selectedOfficial.position}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Discord ID</span>
                                                <span className="detail-value mono">
                                                    {selectedOfficial.discordId}
                                                    <button className="copy-btn" onClick={() => copyToClipboard(selectedOfficial.discordId)}><Icons.Copy /></button>
                                                </span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Citizen ID</span>
                                                <span className="detail-value mono">{selectedOfficial.citizenId}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Registered</span>
                                                <span className="detail-value">{new Date(selectedOfficial.registeredAt).toLocaleString()}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Status</span>
                                                <span className={`detail-value status-${selectedOfficial.status}`}>{selectedOfficial.status}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Personal Info */}
                                    {selectedOfficial.citizen && (
                                        <>
                                            <div className="detail-section">
                                                <div className="section-header">
                                                    <Icons.User />
                                                    <h4>Personal Information</h4>
                                                </div>
                                                <div className="detail-grid">
                                                    <div className="detail-item">
                                                        <span className="detail-label">Full Name</span>
                                                        <span className="detail-value">{selectedOfficial.citizen.name}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Age</span>
                                                        <span className="detail-value">{selectedOfficial.citizen.age} years old</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">State</span>
                                                        <span className="detail-value">{selectedOfficial.citizen.state}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Education</span>
                                                        <span className="detail-value">{selectedOfficial.citizen.education}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Employer</span>
                                                        <span className="detail-value">{selectedOfficial.citizen.employer || 'None'}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Salary</span>
                                                        <span className="detail-value">{formatCurrency(selectedOfficial.citizen.salary)}/month</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Finances */}
                                            <div className="detail-section">
                                                <div className="section-header">
                                                    <Icons.DollarSign />
                                                    <h4>Financial Summary</h4>
                                                </div>
                                                <div className="finance-grid">
                                                    <div className="finance-card">
                                                        <span className="finance-label">Cash</span>
                                                        <span className="finance-value">{formatCurrency(selectedOfficial.citizen.balance)}</span>
                                                    </div>
                                                    <div className="finance-card">
                                                        <span className="finance-label">Checking</span>
                                                        <span className="finance-value">{formatCurrency(selectedOfficial.citizen.checkingBalance)}</span>
                                                    </div>
                                                    <div className="finance-card">
                                                        <span className="finance-label">Savings</span>
                                                        <span className="finance-value">{formatCurrency(selectedOfficial.citizen.savingsBalance)}</span>
                                                    </div>
                                                    <div className="finance-card highlight">
                                                        <span className="finance-label">Net Worth</span>
                                                        <span className="finance-value">{formatCurrency(selectedOfficial.citizen.netWorth)}</span>
                                                    </div>
                                                    <div className="finance-card">
                                                        <span className="finance-label">Credit Score</span>
                                                        <span className={`finance-value score-${selectedOfficial.citizen.creditScore >= 700 ? 'good' : selectedOfficial.citizen.creditScore >= 600 ? 'fair' : 'poor'}`}>
                                                            {selectedOfficial.citizen.creditScore}
                                                        </span>
                                                    </div>
                                                    <div className="finance-card">
                                                        <span className="finance-label">Taxes Paid</span>
                                                        <span className="finance-value">{formatCurrency(selectedOfficial.citizen.taxesPaid)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Housing */}
                                            {selectedOfficial.citizen.housing && (
                                                <div className="detail-section">
                                                    <div className="section-header">
                                                        <Icons.Home />
                                                        <h4>Residence</h4>
                                                    </div>
                                                    <div className="housing-card">
                                                        {selectedOfficial.citizen.housing.address?.oneLine || 'Unknown address'}
                                                        {selectedOfficial.citizen.housing.address?.special && (
                                                            <span className="special-badge">Official Residence</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Criminal Record */}
                                            <div className="detail-section">
                                                <div className="section-header">
                                                    <Icons.Shield />
                                                    <h4>Legal Record</h4>
                                                </div>
                                                <div className="detail-grid">
                                                    <div className="detail-item">
                                                        <span className="detail-label">Criminal Record</span>
                                                        <span className={`detail-value ${selectedOfficial.citizen.criminalRecord > 0 ? 'text-danger' : 'text-success'}`}>
                                                            {selectedOfficial.citizen.criminalRecord > 0 ? `${selectedOfficial.citizen.criminalRecord} offenses` : 'Clean'}
                                                        </span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Arrests</span>
                                                        <span className={`detail-value ${selectedOfficial.citizen.arrests > 0 ? 'text-warning' : 'text-success'}`}>
                                                            {selectedOfficial.citizen.arrests > 0 ? `${selectedOfficial.citizen.arrests} arrests` : 'None'}
                                                        </span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Citizen Since</span>
                                                        <span className="detail-value">{new Date(selectedOfficial.citizen.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="modal-actions">
                                <button className="btn-secondary" onClick={closeModal}>Close</button>
                                <a 
                                    href={`https://discord.com/users/${selectedOfficial.discordId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary"
                                >
                                    <Icons.ExternalLink /> View Discord
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .page-header { margin-bottom: 24px; }
                .page-title { font-size: 28px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
                .page-subtitle { font-size: 15px; color: var(--text-muted); }
                .last-updated { font-size: 13px; color: var(--text-dim); }

                .stats-row { display: flex; gap: 16px; margin-bottom: 24px; }
                .stat-item {
                    background: var(--bg-elevated);
                    border: 1px solid var(--border-subtle);
                    border-radius: 12px;
                    padding: 20px 28px;
                    display: flex; flex-direction: column; gap: 4px;
                    flex: 1;
                }
                .stat-item.executive { border-left: 3px solid #f59e0b; }
                .stat-item.cabinet { border-left: 3px solid #10b981; }
                .stat-item.other { border-left: 3px solid #64748b; }
                .stat-value { font-size: 28px; font-weight: 700; color: var(--text-primary); }
                .stat-label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

                .tabs-container { display: flex; gap: 8px; margin-bottom: 24px; }
                .tab-btn {
                    display: flex; align-items: center; gap: 8px;
                    padding: 10px 16px;
                    background: transparent;
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    color: var(--text-secondary);
                    font-size: 13px; font-weight: 500;
                    cursor: pointer; transition: all 0.15s;
                }
                .tab-btn:hover { background: var(--bg-hover); border-color: var(--border-hover); color: var(--text-primary); }
                .tab-btn.active { background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3); color: #60a5fa; }
                .tab-count { background: rgba(255, 255, 255, 0.1); padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; }
                .tab-btn.active .tab-count { background: rgba(96, 165, 250, 0.2); }

                .card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid var(--border-subtle); }
                .card-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
                .card-count { font-size: 13px; color: var(--text-muted); }

                .officials-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 16px;
                    padding: 20px;
                }

                .official-card {
                    background: var(--bg-elevated);
                    border: 1px solid var(--border-subtle);
                    border-radius: 12px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.15s;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .official-card:hover {
                    border-color: var(--border-hover);
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                }

                .official-avatar {
                    width: 56px; height: 56px;
                    border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 24px; font-weight: 700; color: white;
                }

                .official-info { display: flex; flex-direction: column; gap: 4px; }
                .official-name { font-size: 16px; font-weight: 600; color: var(--text-primary); }
                .official-position { font-size: 13px; color: var(--text-muted); }

                .official-ids { margin-top: auto; }
                .gov-id { font-size: 11px; background: var(--bg-hover); padding: 4px 8px; border-radius: 4px; color: var(--accent-blue); }

                .official-date { font-size: 12px; color: var(--text-dim); }

                .empty-state {
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                    padding: 48px 24px; text-align: center;
                }
                .empty-state p { font-size: 15px; color: var(--text-secondary); }

                /* Modal */
                .modal-overlay {
                    position: fixed; inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }
                .modal {
                    background: var(--bg-surface);
                    border: 1px solid var(--border-subtle);
                    border-radius: 16px;
                    width: 100%;
                    max-width: 700px;
                    max-height: 90vh;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .modal-header {
                    display: flex; justify-content: space-between; align-items: flex-start;
                    padding: 24px;
                    border-bottom: 1px solid var(--border-subtle);
                }
                .modal-title-row { display: flex; align-items: center; gap: 16px; }
                .modal-avatar {
                    width: 64px; height: 64px;
                    border-radius: 16px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 28px; font-weight: 700; color: white;
                }
                .modal-header h2 { font-size: 20px; font-weight: 600; color: var(--text-primary); margin: 0 0 4px 0; }
                .modal-position { font-size: 14px; color: var(--text-muted); }
                .modal-close {
                    width: 36px; height: 36px;
                    display: flex; align-items: center; justify-content: center;
                    background: transparent; border: none;
                    color: var(--text-muted); cursor: pointer;
                    border-radius: 8px; transition: all 0.15s;
                }
                .modal-close:hover { background: var(--bg-hover); color: var(--text-primary); }
                .modal-close :global(svg) { width: 20px; height: 20px; }

                .modal-body { padding: 24px; overflow-y: auto; }
                .loading-details { text-align: center; padding: 40px; color: var(--text-muted); }

                .detail-sections { display: flex; flex-direction: column; gap: 24px; }
                .detail-section { background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 20px; }
                .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
                .section-header :global(svg) { width: 18px; height: 18px; color: var(--text-muted); }
                .section-header h4 { font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 0; }

                .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                .detail-item { display: flex; flex-direction: column; gap: 4px; }
                .detail-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
                .detail-value { font-size: 14px; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
                .detail-value.mono { font-family: var(--font-mono); font-size: 12px; }
                .detail-value.status-active { color: #10b981; }
                .detail-value.status-inactive { color: #ef4444; }
                .text-success { color: #10b981; }
                .text-warning { color: #f59e0b; }
                .text-danger { color: #ef4444; }

                .copy-btn {
                    width: 24px; height: 24px;
                    display: flex; align-items: center; justify-content: center;
                    background: transparent; border: none;
                    color: var(--text-muted); cursor: pointer;
                    border-radius: 4px; transition: all 0.15s;
                }
                .copy-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
                .copy-btn :global(svg) { width: 14px; height: 14px; }

                .finance-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
                .finance-card {
                    background: var(--bg-hover);
                    border-radius: 8px;
                    padding: 12px 16px;
                    display: flex; flex-direction: column; gap: 4px;
                }
                .finance-card.highlight { background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15)); }
                .finance-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }
                .finance-value { font-size: 16px; font-weight: 700; color: var(--text-primary); }
                .finance-value.score-good { color: #10b981; }
                .finance-value.score-fair { color: #f59e0b; }
                .finance-value.score-poor { color: #ef4444; }

                .housing-card {
                    background: var(--bg-hover);
                    border-radius: 8px;
                    padding: 16px;
                    font-size: 14px;
                    color: var(--text-primary);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .special-badge {
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                }

                .modal-actions {
                    display: flex; justify-content: flex-end; gap: 12px;
                    padding-top: 24px;
                    border-top: 1px solid var(--border-subtle);
                    margin-top: 24px;
                }
                .btn-secondary {
                    padding: 10px 18px;
                    background: var(--bg-elevated);
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    color: var(--text-secondary);
                    font-size: 14px; font-weight: 500;
                    cursor: pointer; transition: all 0.15s;
                }
                .btn-secondary:hover { background: var(--bg-hover); border-color: var(--border-hover); }
                .btn-primary {
                    display: flex; align-items: center; gap: 8px;
                    padding: 10px 18px;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    border: none; border-radius: 8px;
                    color: white; font-size: 14px; font-weight: 600;
                    cursor: pointer; transition: all 0.15s;
                    text-decoration: none;
                }
                .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
                .btn-primary :global(svg) { width: 16px; height: 16px; }

                @media (max-width: 700px) {
                    .stats-row { flex-wrap: wrap; }
                    .stat-item { min-width: calc(50% - 8px); }
                    .detail-grid { grid-template-columns: 1fr; }
                    .finance-grid { grid-template-columns: 1fr 1fr; }
                }
            `}</style>
        </div>
    );
}
