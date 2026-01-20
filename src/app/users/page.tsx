'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSession } from '@/hooks/useSession';

interface UserData {
    user: {
        id: string;
        username?: string;
        displayName?: string;
        avatar?: string;
        nickname?: string;
        roles?: Array<{ id: string; name: string; color: string }>;
        joinedAt?: string;
        permissionLevel?: number;
    };
    cases: Array<{
        case_id: string;
        action_type: string;
        reason: string;
        created_at: string;
        moderator_tag: string;
        status: string;
    }>;
    caseCount: number;
    activity: {
        totalMessages: number;
        totalVoice: number;
        activeDays: number;
    };
}

export default function UsersPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [searchId, setSearchId] = useState('');
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        if (!searchId.trim()) return;
        setLoading(true);
        setError('');
        setUser(null);

        try {
            const res = await fetch(`/api/bot/users/${searchId}`);
            if (!res.ok) throw new Error('User not found');
            setUser(await res.json());
        } catch {
            setError('Could not fetch user. Make sure bot API is running.');
        } finally {
            setLoading(false);
        }
    };

    if (sessionLoading) return <div className="admin-layout"><div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div></div>;

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div style={{ maxWidth: '1000px' }}>
                    <div className="page-header">
                        <h1 className="page-title">User Lookup</h1>
                        <p className="page-subtitle">Search by Discord ID to view moderation history</p>
                    </div>

                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter Discord User ID..."
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                style={{ flex: 1 }}
                            />
                            <button onClick={handleSearch} disabled={loading} className="btn btn-primary">
                                {loading ? 'Searching...' : '🔍 Search'}
                            </button>
                        </div>
                    </div>

                    {error && <div className="alert-warning" style={{ marginBottom: '24px' }}>{error}</div>}

                    {user && (
                        <>
                            <div className="card" style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                    {user.user.avatar ? (
                                        <img src={user.user.avatar} alt="" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
                                    ) : (
                                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>👤</div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>{user.user.displayName || user.user.username || 'Unknown User'}</h2>
                                        <p style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>@{user.user.username}</p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>ID: {user.user.id}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ textAlign: 'center', padding: '12px 20px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--accent-primary)' }}>{user.caseCount}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cases</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '12px 20px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#9c27b0' }}>{user.activity.totalMessages}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Messages</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '12px 20px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#4caf50' }}>{Math.round(user.activity.totalVoice / 60)}h</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Voice</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">📋 Moderation History</h3>
                                </div>
                                {user.cases.length > 0 ? user.cases.map((c) => (
                                    <div key={c.case_id} className="case-item">
                                        <div className="case-left">
                                            <span className={`case-badge badge-${c.action_type}`}>{c.action_type.toUpperCase()}</span>
                                            <div className="case-info">
                                                <h4>{c.reason || 'No reason provided'}</h4>
                                                <p>By {c.moderator_tag}</p>
                                            </div>
                                        </div>
                                        <div className="case-right">
                                            <div className="case-id">{c.case_id}</div>
                                            <div className="case-date">{new Date(c.created_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="empty-state">No moderation history</div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
