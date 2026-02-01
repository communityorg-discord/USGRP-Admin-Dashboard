'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSession } from '@/hooks/useSession';

export default function IACPage() {
    const { session, loading, logout } = useSession();
    const [activeTab, setActiveTab] = useState('Memos');

    const tabs = ['Memos', 'Archive', 'GDPR', 'Risk Matrix', 'Logs', 'Gov Reports'];

    if (loading) return <div className="admin-layout"><div className="admin-main">Loading...</div></div>;

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div className="page-header">
                    <h1 className="page-title">Internal Affairs & Compliance</h1>
                    <p className="page-subtitle">Manage IAC documents, reports, and logs</p>
                </div>

                <div className="card" style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '8px', padding: '16px', overflowX: 'auto' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                className={`quick-action-btn ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                                style={activeTab === tab ? { 
                                    borderColor: 'var(--accent-primary)', 
                                    color: 'var(--accent-primary)',
                                    backgroundColor: 'rgba(88, 166, 255, 0.1)' 
                                } : {}}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">{activeTab}</h3>
                    </div>
                    <div className="card-content">
                        <div className="empty-state">
                            <p>Content for {activeTab} tab.</p>
                            <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>This module is currently under development.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
