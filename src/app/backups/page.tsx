'use client';

import Sidebar from '@/components/Sidebar';
import { useSession } from '@/hooks/useSession';

export default function BackupsPage() {
    const { session, loading, logout } = useSession();

    if (loading) return <div className="admin-layout"><div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div></div>;

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div style={{ maxWidth: '1000px' }}>
                    <div className="page-header">
                        <h1 className="page-title">Backups</h1>
                        <p className="page-subtitle">Database and configuration backup management</p>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">💾 Available Backups</h3>
                        </div>
                        <div className="empty-state">
                            <p>Backup system is managed via the bot.</p>
                            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>Use /backup commands in Discord to create and restore backups.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
