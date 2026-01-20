'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSession } from '@/hooks/useSession';

export default function StaffDashboardPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [staff, setStaff] = useState<Array<{ id: number; discord_id: string; email: string; display_name: string; linked_at: string }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session) {
            fetch('/api/bot/staff')
                .then(r => r.ok ? r.json() : [])
                .then(setStaff)
                .catch(() => setStaff([]))
                .finally(() => setLoading(false));
        }
    }, [session]);

    if (sessionLoading) return <div className="admin-layout"><div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div></div>;

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div style={{ maxWidth: '1000px', width: '100%' }}>
                    <div className="page-header">
                        <h1 className="page-title">Staff Dashboard</h1>
                        <p className="page-subtitle">Linked staff accounts with dashboard access</p>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">👥 Staff Accounts ({staff.length})</h3>
                        </div>
                        {loading ? (
                            <div className="empty-state">Loading staff...</div>
                        ) : staff.length > 0 ? (
                            staff.map((s) => (
                                <div key={s.id} className="case-item">
                                    <div className="case-left">
                                        <div className="official-avatar-placeholder" style={{ width: '40px', height: '40px', fontSize: '16px' }}>👤</div>
                                        <div className="case-info">
                                            <h4>{s.display_name || s.email}</h4>
                                            <p style={{ fontSize: '12px' }}>{s.email}</p>
                                        </div>
                                    </div>
                                    <div className="case-right">
                                        <div className="case-id" style={{ fontFamily: 'monospace' }}>{s.discord_id}</div>
                                        <div className="case-date">Linked {new Date(s.linked_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <p>No linked staff accounts</p>
                                <p style={{ marginTop: '8px', fontSize: '12px' }}>Use /staff link to link Discord accounts for dashboard access.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
