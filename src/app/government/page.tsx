'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSession } from '@/hooks/useSession';

interface Official {
    govId: string;
    discordId: string;
    username: string | null;
    avatar: string | null;
    position: string;
    positionKey: string;
    assignedAt: string;
    registeredAt: string;
}

export default function GovernmentPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [officials, setOfficials] = useState<Official[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    useEffect(() => {
        if (session) {
            fetch('/api/bot/government')
                .then(r => r.ok ? r.json() : { officials: [] })
                .then(data => {
                    setOfficials(data.officials || []);
                    setLastUpdated(data.lastUpdated);
                })
                .catch(() => { })
                .finally(() => setLoading(false));
        }
    }, [session]);

    if (sessionLoading) return <div className="admin-layout"><div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div></div>;

    const executiveOffice = officials.filter(o => ['president', 'vicePresident', 'whiteHouseChiefOfStaff'].includes(o.positionKey) || o.positionKey.startsWith('wh'));
    const cabinet = officials.filter(o => o.positionKey.startsWith('secretaryOf'));
    const agencies = officials.filter(o => !executiveOffice.includes(o) && !cabinet.includes(o));

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div style={{ maxWidth: '1200px', width: '100%' }}>
                    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 className="page-title">Government Officials</h1>
                            <p className="page-subtitle">Current administration appointments from autorole</p>
                        </div>
                        {lastUpdated && (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Last updated: {new Date(lastUpdated).toLocaleString()}
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="card"><div className="empty-state">Loading officials...</div></div>
                    ) : (
                        <>
                            {executiveOffice.length > 0 && (
                                <div className="card" style={{ marginBottom: '24px' }}>
                                    <div className="card-header">
                                        <h3 className="card-title">🏛️ Executive Office ({executiveOffice.length})</h3>
                                    </div>
                                    <div className="official-grid">
                                        {executiveOffice.map((o) => (
                                            <div key={o.govId} className="official-card">
                                                {o.avatar ? (
                                                    <img src={o.avatar} alt="" className="official-avatar" />
                                                ) : (
                                                    <div className="official-avatar-placeholder">👤</div>
                                                )}
                                                <div className="official-info">
                                                    <div className="official-name">{o.username || o.discordId}</div>
                                                    <div className="official-position">{o.position}</div>
                                                    <div className="official-meta">
                                                        <span className="official-id">{o.govId}</span>
                                                        <span className="official-since">Since {new Date(o.assignedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {cabinet.length > 0 && (
                                <div className="card" style={{ marginBottom: '24px' }}>
                                    <div className="card-header">
                                        <h3 className="card-title">📋 Cabinet Secretaries ({cabinet.length})</h3>
                                    </div>
                                    <div className="official-grid">
                                        {cabinet.map((o) => (
                                            <div key={o.govId} className="official-card">
                                                {o.avatar ? (
                                                    <img src={o.avatar} alt="" className="official-avatar" />
                                                ) : (
                                                    <div className="official-avatar-placeholder">👤</div>
                                                )}
                                                <div className="official-info">
                                                    <div className="official-name">{o.username || o.discordId}</div>
                                                    <div className="official-position">{o.position}</div>
                                                    <div className="official-meta">
                                                        <span className="official-id">{o.govId}</span>
                                                        <span className="official-since">Since {new Date(o.assignedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {agencies.length > 0 && (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">🏢 Other Officials ({agencies.length})</h3>
                                    </div>
                                    <div className="official-grid">
                                        {agencies.map((o) => (
                                            <div key={o.govId} className="official-card">
                                                {o.avatar ? (
                                                    <img src={o.avatar} alt="" className="official-avatar" />
                                                ) : (
                                                    <div className="official-avatar-placeholder">👤</div>
                                                )}
                                                <div className="official-info">
                                                    <div className="official-name">{o.username || o.discordId}</div>
                                                    <div className="official-position">{o.position}</div>
                                                    <div className="official-meta">
                                                        <span className="official-id">{o.govId}</span>
                                                        <span className="official-since">Since {new Date(o.assignedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {officials.length === 0 && (
                                <div className="card">
                                    <div className="empty-state">
                                        <p>No government officials found</p>
                                        <p style={{ marginTop: '8px', fontSize: '12px' }}>Officials assigned via /autorole will appear here.</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
