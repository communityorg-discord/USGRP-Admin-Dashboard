'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSession } from '@/hooks/useSession';

interface APIStatus {
    name: string;
    url: string;
    status: 'online' | 'offline' | 'checking';
    latency?: number;
    lastChecked?: string;
}

interface GitHubWorkflow {
    id: number;
    name: string;
    status: string;
    conclusion: string | null;
    created_at: string;
    html_url: string;
}

export default function BotDevPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [apis, setApis] = useState<APIStatus[]>([
        { name: 'Admin API', url: 'http://localhost:3003/api/stats', status: 'checking' },
        { name: 'Economy Bot API', url: 'http://localhost:3004/health', status: 'checking' },
        { name: 'Gov Utils Bot', url: 'http://localhost:3005/health', status: 'checking' },
    ]);
    const [workflows, setWorkflows] = useState<GitHubWorkflow[]>([]);
    const [loadingWorkflows, setLoadingWorkflows] = useState(false);
    const [envVars, setEnvVars] = useState<Record<string, string>>({});

    // Bot Developer Discord ID - hardcoded access check
    const BOT_DEVELOPER_ID = '723199054514749450';

    // Check if current user is bot developer
    const isBotDeveloper = session?.discordId === BOT_DEVELOPER_ID;

    useEffect(() => {
        if (session && isBotDeveloper) {
            checkApiStatus();
            fetchWorkflows();
        }
    }, [session, isBotDeveloper]);

    const checkApiStatus = async () => {
        const updatedApis = await Promise.all(
            apis.map(async (api) => {
                const startTime = Date.now();
                try {
                    const res = await fetch(`/api/dev/health-check?url=${encodeURIComponent(api.url)}`, {
                        method: 'GET',
                        cache: 'no-store',
                    });
                    const latency = Date.now() - startTime;
                    if (res.ok) {
                        return { ...api, status: 'online' as const, latency, lastChecked: new Date().toISOString() };
                    }
                    return { ...api, status: 'offline' as const, lastChecked: new Date().toISOString() };
                } catch {
                    return { ...api, status: 'offline' as const, lastChecked: new Date().toISOString() };
                }
            })
        );
        setApis(updatedApis);
    };

    const fetchWorkflows = async () => {
        setLoadingWorkflows(true);
        try {
            const res = await fetch('/api/dev/github-workflows');
            if (res.ok) {
                const data = await res.json();
                setWorkflows(data.workflows || []);
            }
        } catch (e) {
            console.error('Failed to fetch workflows:', e);
        }
        setLoadingWorkflows(false);
    };

    if (sessionLoading) {
        return (
            <div className="admin-layout">
                <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Loading...
                </div>
            </div>
        );
    }

    // Access denied for non-bot developers
    if (!isBotDeveloper) {
        return (
            <div className="admin-layout">
                <Sidebar session={session} onLogout={logout} />
                <main className="admin-main">
                    <div style={{ maxWidth: '600px', width: '100%', margin: '100px auto', textAlign: 'center' }}>
                        <div className="card">
                            <div style={{ padding: '60px 40px' }}>
                                <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔒</div>
                                <h1 style={{ fontSize: '24px', marginBottom: '12px', color: 'var(--text-primary)' }}>Access Denied</h1>
                                <p style={{ color: 'var(--text-muted)' }}>This section is restricted to Bot Developers only.</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div>
                    <div className="page-header">
                        <h1 className="page-title">🛠️ Bot Developer Console</h1>
                        <p className="page-subtitle">System monitoring, API management, and deployment controls</p>
                    </div>

                    {/* API Status Grid */}
                    <div className="stats-grid" style={{ marginBottom: '24px' }}>
                        {apis.map((api) => (
                            <div key={api.name} className="stat-card">
                                <div className="stat-label">
                                    <span className="stat-icon" style={{
                                        color: api.status === 'online' ? 'var(--accent-success)' :
                                            api.status === 'offline' ? 'var(--accent-danger)' : 'var(--text-muted)'
                                    }}>
                                        {api.status === 'online' ? '●' : api.status === 'offline' ? '○' : '◐'}
                                    </span>
                                    {api.name}
                                </div>
                                <div className="stat-value" style={{
                                    fontSize: '18px',
                                    color: api.status === 'online' ? 'var(--accent-success)' :
                                        api.status === 'offline' ? 'var(--accent-danger)' : 'var(--text-muted)'
                                }}>
                                    {api.status === 'online' ? 'Online' : api.status === 'offline' ? 'Offline' : 'Checking...'}
                                </div>
                                {api.latency && (
                                    <div className="stat-meta">{api.latency}ms latency</div>
                                )}
                            </div>
                        ))}
                        <div className="stat-card">
                            <div className="stat-label"><span className="stat-icon">🔄</span> Refresh Status</div>
                            <button
                                onClick={checkApiStatus}
                                className="btn btn-secondary"
                                style={{ marginTop: '8px', width: '100%' }}
                            >
                                Check All APIs
                            </button>
                        </div>
                    </div>

                    <div className="content-grid">
                        {/* GitHub Workflows */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">📦 Recent Deployments</h3>
                                <button onClick={fetchWorkflows} className="btn btn-secondary" disabled={loadingWorkflows}>
                                    {loadingWorkflows ? 'Loading...' : 'Refresh'}
                                </button>
                            </div>
                            {workflows.length > 0 ? (
                                workflows.slice(0, 10).map((wf) => (
                                    <div key={wf.id} className="case-item">
                                        <div className="case-left">
                                            <span className={`case-badge ${wf.conclusion === 'success' ? 'badge-success' :
                                                wf.conclusion === 'failure' ? 'badge-ban' : 'badge-muted'
                                                }`}>
                                                {wf.conclusion?.toUpperCase() || wf.status.toUpperCase()}
                                            </span>
                                            <div className="case-info">
                                                <h4>{wf.name}</h4>
                                                <p>{new Date(wf.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="case-right">
                                            <a href={wf.html_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                                                View
                                            </a>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-state">
                                    {loadingWorkflows ? 'Loading workflows...' : 'No recent workflows found'}
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">⚡ Quick Actions</h3>
                            </div>
                            <div style={{ padding: 'var(--spacing-lg)', display: 'grid', gap: 'var(--spacing-md)' }}>
                                <a href="https://github.com/communityorg-discord" target="_blank" rel="noopener noreferrer" className="quick-action-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>📂</span> GitHub Organization
                                </a>
                                <a href="https://github.com/communityorg-discord/USGRP-Admin-Dashboard/actions" target="_blank" rel="noopener noreferrer" className="quick-action-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>🔧</span> Dashboard Actions
                                </a>
                                <a href="https://github.com/communityorg-discord/CO-Gov-Utils/actions" target="_blank" rel="noopener noreferrer" className="quick-action-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>🤖</span> Gov Utils Actions
                                </a>
                                <a href="https://github.com/communityorg-discord/CO-Economy-Bot/actions" target="_blank" rel="noopener noreferrer" className="quick-action-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>💰</span> Economy Bot Actions
                                </a>
                            </div>

                            <div className="card-header" style={{ borderTop: '1px solid var(--border-default)' }}>
                                <h3 className="card-title">🔗 External Links</h3>
                            </div>
                            <div style={{ padding: 'var(--spacing-lg)', display: 'grid', gap: 'var(--spacing-md)' }}>
                                <a href="https://admin.usgrp.xyz" target="_blank" rel="noopener noreferrer" className="quick-action-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>🌐</span> Production Dashboard
                                </a>
                                <a href="https://mail.usgrp.xyz" target="_blank" rel="noopener noreferrer" className="quick-action-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>📧</span> Webmail
                                </a>
                                <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="quick-action-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>🎮</span> Discord Developer Portal
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* System Info */}
                    <div className="card" style={{ marginTop: '24px' }}>
                        <div className="card-header">
                            <h3 className="card-title">📊 System Information</h3>
                        </div>
                        <div style={{ padding: 'var(--spacing-lg)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-lg)' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Logged in as</div>
                                    <div style={{ fontWeight: 500 }}>{session?.email}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Discord ID</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{session?.discordId}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Permission Level</div>
                                    <div style={{ color: 'var(--gov-gold)' }}>🔧 BOT_DEVELOPER</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Dashboard Version</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>v2.0.0</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
