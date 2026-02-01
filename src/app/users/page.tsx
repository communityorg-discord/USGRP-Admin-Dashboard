'use client';

import { useState } from 'react';
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
        } catch (e: any) {
            setError(e.message || 'Failed to fetch user');
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

    const getBadgeClass = (type: string) => {
        switch (type) {
            case 'warn': return 'badge-warn';
            case 'mute': return 'badge-mute';
            case 'kick': return 'badge-kick';
            case 'ban': return 'badge-ban';
            default: return '';
        }
    };

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div>
                    {/* Header */}
                    <div className="page-header">
                        <h1 className="page-title">User Lookup</h1>
                        <p className="page-subtitle">Search for users by Discord ID</p>
                    </div>

                    {/* Search */}
                    <div className="search-card">
                        <div className="search-box">
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Enter Discord User ID..."
                                value={searchId}
                                onChange={e => setSearchId(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            />
                            <button 
                                className="btn btn-primary" 
                                onClick={handleSearch}
                                disabled={loading}
                            >
                                {loading ? 'Searching...' : 'Search'}
                            </button>
                        </div>
                        {error && <p className="error-text">{error}</p>}
                    </div>

                    {/* Results */}
                    {user && (
                        <div className="results">
                            {/* User Card */}
                            <div className="user-card">
                                <div className="user-header">
                                    <div className="user-avatar">
                                        {user.user.avatar ? (
                                            <img src={`https://cdn.discordapp.com/avatars/${user.user.id}/${user.user.avatar}.png?size=128`} alt="" />
                                        ) : (
                                            <span>{(user.user.displayName || user.user.username || 'U')[0].toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div className="user-info">
                                        <h2>{user.user.displayName || user.user.username || 'Unknown'}</h2>
                                        {user.user.nickname && <span className="nickname">"{user.user.nickname}"</span>}
                                        <span className="user-id">{user.user.id}</span>
                                    </div>
                                </div>

                                <div className="user-stats">
                                    <div className="stat">
                                        <span className="stat-value">{user.activity?.totalMessages?.toLocaleString() || 0}</span>
                                        <span className="stat-label">Messages</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">{Math.round((user.activity?.totalVoice || 0) / 60)}h</span>
                                        <span className="stat-label">Voice Time</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">{user.caseCount || 0}</span>
                                        <span className="stat-label">Cases</span>
                                    </div>
                                </div>

                                {user.user.roles && user.user.roles.length > 0 && (
                                    <div className="roles-section">
                                        <h4>Roles</h4>
                                        <div className="roles-list">
                                            {user.user.roles.slice(0, 10).map(role => (
                                                <span 
                                                    key={role.id} 
                                                    className="role-tag"
                                                    style={{ borderColor: role.color || '#64748b' }}
                                                >
                                                    {role.name}
                                                </span>
                                            ))}
                                            {user.user.roles.length > 10 && (
                                                <span className="role-more">+{user.user.roles.length - 10} more</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Cases */}
                            <div className="card">
                                <div className="card-header">
                                    <h3 className="card-title">Moderation History ({user.cases?.length || 0})</h3>
                                </div>
                                {user.cases && user.cases.length > 0 ? (
                                    <div className="cases-list">
                                        {user.cases.map(c => (
                                            <div key={c.case_id} className="case-row">
                                                <span className={`case-badge ${getBadgeClass(c.action_type)}`}>
                                                    {c.action_type.toUpperCase()}
                                                </span>
                                                <div className="case-info">
                                                    <span className="case-reason">{c.reason || 'No reason'}</span>
                                                    <span className="case-mod">by {c.moderator_tag}</span>
                                                </div>
                                                <div className="case-meta">
                                                    <span className="case-id">{c.case_id}</span>
                                                    <span className="case-date">{new Date(c.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <p>No moderation history</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {!user && !loading && !error && (
                        <div className="empty-prompt">
                            <div className="empty-icon">🔍</div>
                            <p>Enter a Discord User ID to look up their profile</p>
                        </div>
                    )}
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

                .search-card {
                    background: var(--bg-elevated);
                    border: 1px solid var(--border-subtle);
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 24px;
                }

                .search-box {
                    display: flex;
                    gap: 12px;
                }

                .search-box input {
                    flex: 1;
                }

                .error-text {
                    color: var(--accent-red);
                    font-size: 14px;
                    margin-top: 12px;
                }

                .results {
                    display: grid;
                    gap: 24px;
                }

                .user-card {
                    background: var(--bg-elevated);
                    border: 1px solid var(--border-subtle);
                    border-radius: 12px;
                    padding: 24px;
                }

                .user-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 24px;
                    padding-bottom: 24px;
                    border-bottom: 1px solid var(--border-subtle);
                }

                .user-avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 16px;
                    background: linear-gradient(135deg, var(--accent-blue), #8b5cf6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                    font-weight: 700;
                    color: white;
                    overflow: hidden;
                    flex-shrink: 0;
                }

                .user-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .user-info h2 {
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                }

                .nickname {
                    font-size: 14px;
                    color: var(--text-muted);
                    font-style: italic;
                    display: block;
                    margin-bottom: 4px;
                }

                .user-id {
                    font-size: 13px;
                    font-family: var(--font-mono);
                    color: var(--text-dim);
                }

                .user-stats {
                    display: flex;
                    gap: 32px;
                    margin-bottom: 24px;
                }

                .stat {
                    display: flex;
                    flex-direction: column;
                }

                .stat .stat-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--text-primary);
                }

                .stat .stat-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .roles-section h4 {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 12px;
                }

                .roles-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .role-tag {
                    padding: 4px 10px;
                    border: 1px solid;
                    border-radius: 6px;
                    font-size: 12px;
                    color: var(--text-secondary);
                }

                .role-more {
                    padding: 4px 10px;
                    font-size: 12px;
                    color: var(--text-muted);
                }

                .cases-list {
                    display: flex;
                    flex-direction: column;
                }

                .case-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 24px;
                    border-bottom: 1px solid var(--border-subtle);
                }

                .case-row:last-child {
                    border-bottom: none;
                }

                .case-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    flex-shrink: 0;
                }

                .badge-warn {
                    background: rgba(245, 158, 11, 0.12);
                    color: #fbbf24;
                    border: 1px solid rgba(245, 158, 11, 0.2);
                }

                .badge-mute {
                    background: rgba(139, 92, 246, 0.12);
                    color: #a78bfa;
                    border: 1px solid rgba(139, 92, 246, 0.2);
                }

                .badge-kick {
                    background: rgba(249, 115, 22, 0.12);
                    color: #fb923c;
                    border: 1px solid rgba(249, 115, 22, 0.2);
                }

                .badge-ban {
                    background: rgba(239, 68, 68, 0.12);
                    color: #f87171;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                }

                .case-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    min-width: 0;
                }

                .case-reason {
                    font-size: 14px;
                    color: var(--text-primary);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .case-mod {
                    font-size: 12px;
                    color: var(--text-muted);
                }

                .case-meta {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 2px;
                }

                .case-id {
                    font-size: 12px;
                    font-family: var(--font-mono);
                    color: var(--text-muted);
                }

                .case-date {
                    font-size: 12px;
                    color: var(--text-dim);
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

                .empty-prompt {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 24px;
                    text-align: center;
                }

                .empty-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }

                .empty-prompt p {
                    font-size: 15px;
                    color: var(--text-muted);
                }
            `}</style>
        </div>
    );
}
