'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function StaffDashboardPage() {
    const router = useRouter();
    const [session, setSession] = useState<{ email?: string; permissionName?: string } | null>(null);
    const [staff, setStaff] = useState<Array<{ id: number; discord_id: string; email: string; display_name: string; linked_at: string }>>([]);
    const [loading, setLoading] = useState(true);

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
                    const res = await fetch('/api/bot/staff');
                    if (res.ok) setStaff(await res.json());
                } catch { }
                setLoading(false);
            });
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={handleLogout} />

            <main className="admin-main">
                <div style={{ maxWidth: '1000px' }}>
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
