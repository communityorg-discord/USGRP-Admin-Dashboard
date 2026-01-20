'use client';

import Sidebar from '@/components/Sidebar';
import { useSession } from '@/hooks/useSession';

export default function AppealsPage() {
    const { session, loading, logout } = useSession();

    if (loading) return <div className="admin-layout"><div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div></div>;

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div style={{ maxWidth: '1000px', width: '100%' }}>
                    <div className="page-header">
                        <h1 className="page-title">Appeals</h1>
                        <p className="page-subtitle">Review and manage ban/mute appeals</p>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">⚖️ Pending Appeals</h3>
                        </div>
                        <div className="empty-state">
                            <p>No pending appeals</p>
                            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>Appeals submitted at usgrp.xyz/appeal will appear here.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
