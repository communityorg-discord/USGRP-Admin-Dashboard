'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSession } from '@/hooks/useSession';

interface StaffAccount {
    id: string;
    email: string;
    discordId: string | null;
    displayName: string;
    authorityLevel: number;
    authorityLabel: string;
    roles: string[];
    permissions: string[];
    enabled: boolean;
    suspended: boolean;
    totpEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}

interface AuditLog {
    id: number;
    userId: string;
    displayName: string;
    email: string;
    action: string;
    target: string;
    targetUser: string;
    details: string;
    ip: string;
    createdAt: string;
}

interface ActiveSession {
    id: string;
    userId: string;
    displayName: string;
    email: string;
    authorityLevel: number;
    deviceName: string;
    deviceFingerprint: string;
    ip: string;
    userAgent: string;
    lastActive: string;
    createdAt: string;
    isRemembered: boolean;
}

interface UserActivity {
    userId: string;
    displayName: string;
    email: string;
    authorityLevel: number;
    actionCount: number;
    lastAction: string;
    failedLogins: number;
    uniqueIps: number;
}

interface SecurityAlert {
    userId: string;
    displayName: string;
    email: string;
    action: string;
    ip: string;
    createdAt: string;
    details: string;
    recentFailures: number;
}

interface ActivityStats {
    actionTypes: Array<{ action: string; count: number }>;
    recentActionTypes: Array<{ action: string; count: number }>;
    loginsByDay: Array<{ date: string; success: number; failed: number; sso: number }>;
    hourlyActivity: Array<{ hour: string; count: number }>;
    activeSessionCount: number;
    totalEvents: number;
}

type TabType = 'accounts' | 'activity' | 'sessions' | 'security';
type ModalType = 'view' | 'edit' | 'create' | 'userActivity' | null;

const AUTHORITY_LEVELS: Record<number, { label: string; color: string }> = {
    0: { label: 'User', color: '#64748b' },
    1: { label: 'Verified', color: '#22c55e' },
    2: { label: 'Moderator', color: '#8b5cf6' },
    3: { label: 'Admin', color: '#3b82f6' },
    4: { label: 'Senior Admin', color: '#f97316' },
    5: { label: 'Superuser', color: '#ef4444' },
    6: { label: 'Developer', color: '#f59e0b' },
};

const ACTION_COLORS: Record<string, string> = {
    'LOGIN_SUCCESS': '#10b981',
    'LOGIN_FAILED': '#ef4444',
    'SSO_ACCESS': '#3b82f6',
    'LOGOUT': '#64748b',
    'PASSWORD_CHANGE': '#f59e0b',
    'PASSWORD_RESET_FORCED': '#ef4444',
    'MFA_ENABLED': '#10b981',
    'MFA_DISABLED': '#f59e0b',
    'USER_CREATED': '#8b5cf6',
    'USER_UPDATED': '#3b82f6',
    'USER_DELETED': '#ef4444',
    'ACCOUNT_LOCKED': '#ef4444',
    'ACCOUNT_UNLOCKED': '#10b981',
    'SESSION_TERMINATED': '#f97316',
};

const ACTION_SEVERITY: Record<string, 'info' | 'warning' | 'critical'> = {
    'LOGIN_SUCCESS': 'info',
    'SSO_ACCESS': 'info',
    'LOGOUT': 'info',
    'USER_UPDATED': 'info',
    'LOGIN_FAILED': 'warning',
    'MFA_DISABLED': 'warning',
    'PASSWORD_CHANGE': 'warning',
    'PASSWORD_RESET_FORCED': 'critical',
    'USER_DELETED': 'critical',
    'ACCOUNT_LOCKED': 'critical',
    'SESSION_TERMINATED': 'warning',
};

const Icons = {
    Users: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    Activity: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
    Monitor: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
    Shield: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    AlertTriangle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
    Edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
    Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
    Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
    Ban: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></svg>,
    Copy: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>,
    Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    Globe: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
    Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>,
    Filter: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>,
    Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
    Download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
    Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
    Eye: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
    Zap: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
};

export default function StaffPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [activeTab, setActiveTab] = useState<TabType>('accounts');
    const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, admins: 0, mfaEnabled: 0 });
    
    // Activity state
    const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
    const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
    const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
    const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
    const [allActions, setAllActions] = useState<string[]>([]);
    const [loadingActivity, setLoadingActivity] = useState(false);
    
    // Filters
    const [activityFilter, setActivityFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [autoRefresh, setAutoRefresh] = useState(false);
    
    // Modal state
    const [modalType, setModalType] = useState<ModalType>(null);
    const [selectedStaff, setSelectedStaff] = useState<StaffAccount | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [userLogs, setUserLogs] = useState<AuditLog[]>([]);
    const [formData, setFormData] = useState({ email: '', displayName: '', discordId: '', password: '', authorityLevel: 0 });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (session) loadAccounts();
    }, [session]);

    useEffect(() => {
        if (session && (activeTab === 'activity' || activeTab === 'sessions' || activeTab === 'security')) {
            loadActivity();
        }
    }, [session, activeTab, activityFilter, severityFilter]);

    // Auto-refresh
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (autoRefresh && (activeTab === 'activity' || activeTab === 'sessions' || activeTab === 'security')) {
            interval = setInterval(loadActivity, 30000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh, activeTab]);

    const loadAccounts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/staff/accounts');
            if (res.ok) {
                const data = await res.json();
                setStaffAccounts(data.accounts || []);
                setStats(data.stats || { total: 0, admins: 0, mfaEnabled: 0 });
            }
        } catch (e) { console.error('Failed to load staff:', e); }
        setLoading(false);
    };

    const loadActivity = useCallback(async () => {
        setLoadingActivity(true);
        try {
            const params = new URLSearchParams();
            params.set('limit', '200');
            if (activityFilter) params.set('action', activityFilter);
            if (searchQuery) params.set('search', searchQuery);
            if (severityFilter !== 'all') params.set('severity', severityFilter);
            
            const res = await fetch(`/api/staff/activity?${params}`);
            if (res.ok) {
                const data = await res.json();
                setActivityLogs(data.logs || []);
                setActivityStats(data.stats || null);
                setActiveSessions(data.activeSessions || []);
                setUserActivity(data.userActivity || []);
                setSecurityAlerts(data.securityAlerts || []);
                setAllActions(data.allActions || []);
            }
        } catch (e) { console.error('Failed to load activity:', e); }
        setLoadingActivity(false);
    }, [activityFilter, searchQuery, severityFilter]);

    const loadUserActivity = async (userId: string) => {
        try {
            const res = await fetch(`/api/staff/activity?userId=${userId}&limit=50`);
            if (res.ok) {
                const data = await res.json();
                setUserLogs(data.logs || []);
            }
        } catch (e) { console.error('Failed to load user activity:', e); }
    };

    const terminateSession = async (sessionId: string) => {
        if (!confirm('Are you sure you want to terminate this session? The user will be logged out.')) return;
        try {
            const res = await fetch(`/api/staff/activity?sessionId=${sessionId}`, { method: 'DELETE' });
            if (res.ok) {
                await loadActivity();
                setSuccess('Session terminated');
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to terminate session');
            }
        } catch (e) { setError('Failed to terminate session'); }
    };

    const exportLogs = () => {
        const csv = [
            ['ID', 'User', 'Email', 'Action', 'Target', 'Details', 'IP', 'Timestamp'].join(','),
            ...activityLogs.map(log => [
                log.id,
                `"${log.displayName}"`,
                log.email,
                log.action,
                `"${log.target || ''}"`,
                `"${log.details || ''}"`,
                log.ip,
                log.createdAt
            ].join(','))
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const openUserActivity = (userId: string, displayName: string) => {
        setSelectedUserId(userId);
        loadUserActivity(userId);
        setModalType('userActivity');
    };

    // ... (rest of modal handlers same as before)
    const openViewModal = (staff: StaffAccount) => { setSelectedStaff(staff); setModalType('view'); setError(''); setSuccess(''); };
    const openEditModal = (staff: StaffAccount) => { setSelectedStaff(staff); setFormData({ email: staff.email, displayName: staff.displayName, discordId: staff.discordId || '', password: '', authorityLevel: staff.authorityLevel }); setModalType('edit'); setError(''); setSuccess(''); };
    const openCreateModal = () => { setSelectedStaff(null); setFormData({ email: '', displayName: '', discordId: '', password: '', authorityLevel: 0 }); setModalType('create'); setError(''); setSuccess(''); };
    const closeModal = () => { setModalType(null); setSelectedStaff(null); setSelectedUserId(null); setUserLogs([]); setError(''); setSuccess(''); };

    const handleSave = async () => {
        setSaving(true); setError(''); setSuccess('');
        try {
            if (modalType === 'create') {
                if (!formData.email || !formData.displayName || !formData.password) { setError('Email, display name, and password are required'); setSaving(false); return; }
                const res = await fetch('/api/staff/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to create account');
                setSuccess('Account created successfully'); await loadAccounts(); setTimeout(closeModal, 1500);
            } else if (modalType === 'edit' && selectedStaff) {
                const updates: any = { userId: selectedStaff.id, email: formData.email, displayName: formData.displayName, discordId: formData.discordId || null, authorityLevel: formData.authorityLevel };
                if (formData.password) updates.password = formData.password;
                const res = await fetch('/api/staff/accounts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to update account');
                setSuccess('Account updated successfully'); await loadAccounts(); setTimeout(closeModal, 1500);
            }
        } catch (e: any) { setError(e.message); }
        setSaving(false);
    };

    const handleToggleEnabled = async (staff: StaffAccount) => {
        try {
            const res = await fetch('/api/staff/accounts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: staff.id, enabled: !staff.enabled }) });
            if (res.ok) await loadAccounts();
        } catch (e) { console.error('Toggle failed:', e); }
    };

    const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    };

    const getActionLabel = (action: string) => {
        const labels: Record<string, string> = { 'LOGIN_SUCCESS': 'Login', 'LOGIN_FAILED': 'Failed Login', 'SSO_ACCESS': 'SSO Access', 'LOGOUT': 'Logout', 'PASSWORD_CHANGE': 'Password Changed', 'PASSWORD_RESET_FORCED': 'Password Reset (Forced)', 'MFA_ENABLED': 'MFA Enabled', 'MFA_DISABLED': 'MFA Disabled', 'USER_CREATED': 'User Created', 'USER_UPDATED': 'User Updated', 'USER_DELETED': 'User Deleted', 'ACCOUNT_LOCKED': 'Account Locked', 'ACCOUNT_UNLOCKED': 'Account Unlocked', 'SESSION_TERMINATED': 'Session Terminated' };
        return labels[action] || action.replace(/_/g, ' ');
    };

    const parseUserAgent = (ua: string) => {
        if (!ua) return { device: 'Unknown', browser: 'Unknown', os: 'Unknown' };
        const device = ua.includes('Mobile') ? 'Mobile' : 'Desktop';
        let browser = 'Unknown';
        if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        let os = 'Unknown';
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
        return { device, browser, os };
    };

    if (sessionLoading) {
        return <div className="admin-layout"><div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Loading...</span></div></div>;
    }

    const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
        { id: 'accounts', label: 'Accounts', icon: <Icons.Users /> },
        { id: 'activity', label: 'Activity Log', icon: <Icons.Activity /> },
        { id: 'sessions', label: 'Sessions', icon: <Icons.Monitor />, badge: activeSessions.length },
        { id: 'security', label: 'Security', icon: <Icons.AlertTriangle />, badge: securityAlerts.length > 0 ? securityAlerts.length : undefined },
    ];

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div>
                    {/* Header */}
                    <div className="page-header">
                        <div>
                            <h1 className="page-title">Staff Management</h1>
                            <p className="page-subtitle">Manage accounts, monitor activity, and track security</p>
                        </div>
                        <div className="header-actions">
                            {activeTab === 'accounts' && (
                                <button className="btn-primary" onClick={openCreateModal}><Icons.Plus /> New Account</button>
                            )}
                            {(activeTab === 'activity' || activeTab === 'sessions' || activeTab === 'security') && (
                                <>
                                    <button className={`btn-icon ${autoRefresh ? 'active' : ''}`} onClick={() => setAutoRefresh(!autoRefresh)} title={autoRefresh ? 'Auto-refresh ON (30s)' : 'Auto-refresh OFF'}>
                                        <Icons.Zap />
                                    </button>
                                    <button className="btn-secondary" onClick={loadActivity} disabled={loadingActivity}>
                                        <Icons.Refresh /> {loadingActivity ? 'Loading...' : 'Refresh'}
                                    </button>
                                    {activeTab === 'activity' && (
                                        <button className="btn-secondary" onClick={exportLogs}><Icons.Download /> Export</button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Stats Row */}
                    {activeTab === 'accounts' && (
                        <div className="stats-row">
                            <div className="stat-item"><span className="stat-value">{stats.total}</span><span className="stat-label">Total Accounts</span></div>
                            <div className="stat-item"><span className="stat-value">{stats.admins}</span><span className="stat-label">Admins+</span></div>
                            <div className="stat-item"><span className="stat-value">{stats.mfaEnabled}</span><span className="stat-label">MFA Enabled</span></div>
                        </div>
                    )}

                    {activeTab === 'activity' && activityStats && (
                        <div className="stats-row">
                            <div className="stat-item"><span className="stat-value">{activityStats.totalEvents.toLocaleString()}</span><span className="stat-label">Total Events</span></div>
                            <div className="stat-item"><span className="stat-value">{activityStats.activeSessionCount}</span><span className="stat-label">Active Sessions</span></div>
                            <div className="stat-item success"><span className="stat-value">{activityStats.loginsByDay.reduce((s, d) => s + d.success + d.sso, 0)}</span><span className="stat-label">Successful Logins (14d)</span></div>
                            <div className="stat-item danger"><span className="stat-value">{activityStats.loginsByDay.reduce((s, d) => s + d.failed, 0)}</span><span className="stat-label">Failed Logins (14d)</span></div>
                        </div>
                    )}

                    {activeTab === 'sessions' && (
                        <div className="stats-row">
                            <div className="stat-item highlight"><span className="stat-value">{activeSessions.length}</span><span className="stat-label">Active Sessions</span></div>
                            <div className="stat-item"><span className="stat-value">{new Set(activeSessions.map(s => s.userId)).size}</span><span className="stat-label">Unique Users</span></div>
                            <div className="stat-item"><span className="stat-value">{activeSessions.filter(s => s.isRemembered).length}</span><span className="stat-label">Remembered</span></div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="stats-row">
                            <div className={`stat-item ${securityAlerts.length > 0 ? 'danger' : 'success'}`}>
                                <span className="stat-value">{securityAlerts.length}</span>
                                <span className="stat-label">Security Alerts (24h)</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{securityAlerts.filter(a => a.action === 'LOGIN_FAILED').length}</span>
                                <span className="stat-label">Failed Login Attempts</span>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="tabs-container">
                        {tabs.map(tab => (
                            <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                                <span className="tab-icon">{tab.icon}</span>
                                {tab.label}
                                {tab.badge !== undefined && <span className={`tab-badge ${tab.id === 'security' ? 'danger' : ''}`}>{tab.badge}</span>}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="tab-content">
                        {/* Accounts Tab - same as before but condensed */}
                        {activeTab === 'accounts' && (
                            loading ? <div className="card"><div className="empty-state">Loading...</div></div> : (
                                <div className="card">
                                    <div className="card-header"><h3 className="card-title">Auth System Accounts</h3><span className="card-count">{staffAccounts.length} accounts</span></div>
                                    {staffAccounts.length > 0 ? (
                                        <div className="staff-table">
                                            <div className="table-header"><span>User</span><span>Authority</span><span>Discord ID</span><span>Security</span><span>Status</span><span>Actions</span></div>
                                            {staffAccounts.map(staff => {
                                                const auth = AUTHORITY_LEVELS[staff.authorityLevel] || AUTHORITY_LEVELS[0];
                                                return (
                                                    <div key={staff.id} className="table-row" onClick={() => openViewModal(staff)}>
                                                        <div className="user-cell">
                                                            <div className="staff-avatar" style={{ background: `linear-gradient(135deg, ${auth.color}, ${auth.color}88)` }}>{staff.displayName?.[0]?.toUpperCase() || 'S'}</div>
                                                            <div className="user-info"><span className="user-name">{staff.displayName}</span><span className="user-email">{staff.email}</span></div>
                                                        </div>
                                                        <div><span className="authority-badge" style={{ background: `${auth.color}20`, color: auth.color, borderColor: `${auth.color}40` }}>{auth.label}</span></div>
                                                        <div className="discord-cell">{staff.discordId ? <code>{staff.discordId}</code> : <span className="not-linked">Not linked</span>}</div>
                                                        <div className="security-cell">{staff.totpEnabled ? <span className="mfa-enabled"><Icons.Shield /> MFA</span> : <span className="mfa-disabled">No MFA</span>}</div>
                                                        <div><span className={`status-badge ${staff.enabled ? 'enabled' : 'disabled'}`}>{staff.enabled ? 'Active' : 'Disabled'}</span></div>
                                                        <div className="actions-cell" onClick={e => e.stopPropagation()}>
                                                            <button className="action-btn" title="Edit" onClick={() => openEditModal(staff)}><Icons.Edit /></button>
                                                            <button className={`action-btn ${staff.enabled ? 'danger' : 'success'}`} title={staff.enabled ? 'Disable' : 'Enable'} onClick={() => handleToggleEnabled(staff)}>{staff.enabled ? <Icons.Ban /> : <Icons.Check />}</button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : <div className="empty-state"><p>No staff accounts found</p><button className="btn-primary" onClick={openCreateModal}>Create First Account</button></div>}
                                </div>
                            )
                        )}

                        {/* Activity Log Tab */}
                        {activeTab === 'activity' && (
                            <div className="activity-layout">
                                <div className="activity-sidebar">
                                    {/* Search */}
                                    <div className="filter-card">
                                        <div className="search-input">
                                            <Icons.Search />
                                            <input type="text" placeholder="Search users, IPs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadActivity()} />
                                        </div>
                                    </div>

                                    {/* Filters */}
                                    <div className="filter-card">
                                        <h4><Icons.Filter /> Filters</h4>
                                        <div className="filter-group">
                                            <label>Action Type</label>
                                            <select value={activityFilter} onChange={e => setActivityFilter(e.target.value)}>
                                                <option value="">All Actions</option>
                                                {allActions.map(action => <option key={action} value={action}>{getActionLabel(action)}</option>)}
                                            </select>
                                        </div>
                                        <div className="filter-group">
                                            <label>Severity</label>
                                            <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
                                                <option value="all">All</option>
                                                <option value="warning">Warning</option>
                                                <option value="critical">Critical</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Most Active Users */}
                                    <div className="sidebar-card">
                                        <h4>Most Active (7d)</h4>
                                        <div className="user-activity-list">
                                            {userActivity.slice(0, 8).map((user, i) => (
                                                <div key={user.userId} className="activity-user" onClick={() => openUserActivity(user.userId, user.displayName)}>
                                                    <span className="rank">#{i + 1}</span>
                                                    <div className="user-info">
                                                        <span className="name">{user.displayName}</span>
                                                        <span className="stats">{user.actionCount} actions · {user.uniqueIps} IPs</span>
                                                    </div>
                                                    {user.failedLogins > 0 && <span className="failed-badge">{user.failedLogins} failed</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Hourly Activity Chart */}
                                    {activityStats?.hourlyActivity && activityStats.hourlyActivity.length > 0 && (
                                        <div className="sidebar-card">
                                            <h4>Activity by Hour (24h)</h4>
                                            <div className="hourly-chart">
                                                {Array.from({ length: 24 }, (_, i) => {
                                                    const hour = i.toString().padStart(2, '0');
                                                    const data = activityStats.hourlyActivity.find(h => h.hour === hour);
                                                    const count = data?.count || 0;
                                                    const max = Math.max(...activityStats.hourlyActivity.map(h => h.count));
                                                    return (
                                                        <div key={hour} className="hour-bar" title={`${hour}:00 - ${count} events`}>
                                                            <div className="bar" style={{ height: `${max > 0 ? (count / max) * 100 : 0}%` }} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="chart-labels"><span>00:00</span><span>12:00</span><span>24:00</span></div>
                                        </div>
                                    )}
                                </div>

                                <div className="card activity-log-card">
                                    <div className="card-header">
                                        <h3 className="card-title">Activity Log</h3>
                                        <span className="card-count">{activityLogs.length} events {autoRefresh && <span className="live-dot" />}</span>
                                    </div>
                                    {loadingActivity ? <div className="empty-state">Loading activity...</div> : activityLogs.length > 0 ? (
                                        <div className="activity-log">
                                            {activityLogs.map(log => {
                                                const severity = ACTION_SEVERITY[log.action] || 'info';
                                                return (
                                                    <div key={log.id} className={`log-entry severity-${severity}`}>
                                                        <div className="log-icon" style={{ background: `${ACTION_COLORS[log.action] || '#64748b'}20`, color: ACTION_COLORS[log.action] || '#64748b' }}><Icons.Activity /></div>
                                                        <div className="log-content">
                                                            <div className="log-header">
                                                                <span className="log-user" onClick={() => openUserActivity(log.userId, log.displayName)}>{log.displayName}</span>
                                                                <span className="log-action" style={{ color: ACTION_COLORS[log.action] || '#64748b' }}>{getActionLabel(log.action)}</span>
                                                            </div>
                                                            <div className="log-details">
                                                                {log.target && <span className="log-target">{log.target}</span>}
                                                                {log.details && <span className="log-detail">{log.details}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="log-meta">
                                                            <span className="log-time" title={new Date(log.createdAt).toLocaleString()}><Icons.Clock /> {formatTimeAgo(log.createdAt)}</span>
                                                            {log.ip && <span className="log-ip" title={log.ip}><Icons.Globe /> {log.ip.length > 20 ? log.ip.substring(0, 20) + '...' : log.ip}</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : <div className="empty-state"><p>No activity logs found</p><span>Activity will appear here as users interact</span></div>}
                                </div>
                            </div>
                        )}

                        {/* Sessions Tab */}
                        {activeTab === 'sessions' && (
                            <div className="card">
                                <div className="card-header"><h3 className="card-title">Active Sessions</h3><span className="card-count">{activeSessions.length} sessions</span></div>
                                {loadingActivity ? <div className="empty-state">Loading sessions...</div> : activeSessions.length > 0 ? (
                                    <div className="sessions-grid">
                                        {activeSessions.map(sess => {
                                            const ua = parseUserAgent(sess.userAgent);
                                            const auth = AUTHORITY_LEVELS[sess.authorityLevel] || AUTHORITY_LEVELS[0];
                                            return (
                                                <div key={sess.id} className="session-card">
                                                    <div className="session-header">
                                                        <div className="session-user">
                                                            <div className="session-avatar" style={{ background: `linear-gradient(135deg, ${auth.color}, ${auth.color}88)` }}>{sess.displayName?.[0]?.toUpperCase()}</div>
                                                            <div>
                                                                <span className="session-name">{sess.displayName}</span>
                                                                <span className="session-email">{sess.email}</span>
                                                            </div>
                                                        </div>
                                                        <div className="session-status"><span className="online-dot" />Active</div>
                                                    </div>
                                                    <div className="session-details">
                                                        <div className="session-item"><Icons.Monitor /><span>{ua.device} · {ua.browser} · {ua.os}</span></div>
                                                        <div className="session-item"><Icons.Globe /><span title={sess.ip}>{sess.ip}</span></div>
                                                        <div className="session-item"><Icons.Clock /><span>Last active {formatTimeAgo(sess.lastActive)}</span></div>
                                                        {sess.isRemembered && <div className="session-item remembered"><Icons.Check /><span>Remember me</span></div>}
                                                    </div>
                                                    <div className="session-footer">
                                                        <span className="session-created">Session started {formatTimeAgo(sess.createdAt)}</span>
                                                        <button className="btn-danger-sm" onClick={() => terminateSession(sess.id)} title="Terminate Session"><Icons.Trash /></button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : <div className="empty-state"><p>No active sessions</p><span>Sessions will appear when users log in</span></div>}
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="security-layout">
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title"><Icons.AlertTriangle /> Security Alerts (24h)</h3>
                                        <span className="card-count">{securityAlerts.length} alerts</span>
                                    </div>
                                    {securityAlerts.length > 0 ? (
                                        <div className="alerts-list">
                                            {securityAlerts.map((alert, i) => (
                                                <div key={i} className={`alert-item severity-${ACTION_SEVERITY[alert.action] || 'warning'}`}>
                                                    <div className="alert-icon" style={{ background: `${ACTION_COLORS[alert.action] || '#ef4444'}20`, color: ACTION_COLORS[alert.action] || '#ef4444' }}>
                                                        <Icons.AlertTriangle />
                                                    </div>
                                                    <div className="alert-content">
                                                        <div className="alert-header">
                                                            <span className="alert-user">{alert.displayName}</span>
                                                            <span className="alert-action">{getActionLabel(alert.action)}</span>
                                                        </div>
                                                        <div className="alert-details">
                                                            {alert.recentFailures > 1 && <span className="alert-badge danger">{alert.recentFailures} failures in 1h</span>}
                                                            {alert.details && <span className="alert-detail">{alert.details}</span>}
                                                            {alert.ip && <span className="alert-ip">IP: {alert.ip}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="alert-time">{formatTimeAgo(alert.createdAt)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-state success">
                                            <Icons.Check />
                                            <p>No security alerts in the last 24 hours</p>
                                            <span>All systems operating normally</span>
                                        </div>
                                    )}
                                </div>

                                {/* Login Chart */}
                                {activityStats?.loginsByDay && activityStats.loginsByDay.length > 0 && (
                                    <div className="card">
                                        <div className="card-header"><h3 className="card-title">Login Activity (14 days)</h3></div>
                                        <div className="login-chart-detailed">
                                            {activityStats.loginsByDay.slice().reverse().map(day => {
                                                const total = day.success + day.failed + day.sso;
                                                const maxTotal = Math.max(...activityStats.loginsByDay.map(d => d.success + d.failed + d.sso));
                                                return (
                                                    <div key={day.date} className="chart-day">
                                                        <div className="bar-stack" style={{ height: `${maxTotal > 0 ? (total / maxTotal) * 120 : 0}px` }}>
                                                            {day.sso > 0 && <div className="bar-segment sso" style={{ flex: day.sso }} title={`SSO: ${day.sso}`} />}
                                                            {day.success > 0 && <div className="bar-segment success" style={{ flex: day.success }} title={`Success: ${day.success}`} />}
                                                            {day.failed > 0 && <div className="bar-segment failed" style={{ flex: day.failed }} title={`Failed: ${day.failed}`} />}
                                                        </div>
                                                        <span className="day-label">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="chart-legend">
                                            <span className="legend-item"><span className="dot sso" />SSO</span>
                                            <span className="legend-item"><span className="dot success" />Success</span>
                                            <span className="legend-item"><span className="dot failed" />Failed</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modals */}
            {modalType && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{modalType === 'create' ? 'Create Account' : modalType === 'edit' ? 'Edit Account' : modalType === 'userActivity' ? 'User Activity' : selectedStaff?.displayName}</h2>
                            <button className="modal-close" onClick={closeModal}><Icons.X /></button>
                        </div>

                        {/* User Activity Modal */}
                        {modalType === 'userActivity' && (
                            <div className="modal-body">
                                <div className="user-activity-modal">
                                    {userLogs.length > 0 ? (
                                        <div className="activity-log compact">
                                            {userLogs.map(log => (
                                                <div key={log.id} className="log-entry compact">
                                                    <span className="log-action-sm" style={{ color: ACTION_COLORS[log.action] || '#64748b' }}>{getActionLabel(log.action)}</span>
                                                    <span className="log-target-sm">{log.target || log.details || '-'}</span>
                                                    <span className="log-time-sm">{formatTimeAgo(log.createdAt)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <div className="empty-state"><p>No activity found for this user</p></div>}
                                </div>
                                <div className="modal-actions"><button className="btn-secondary" onClick={closeModal}>Close</button></div>
                            </div>
                        )}

                        {/* View Modal */}
                        {modalType === 'view' && selectedStaff && (
                            <div className="modal-body">
                                <div className="detail-grid">
                                    <div className="detail-section">
                                        <h4>Account Information</h4>
                                        <div className="detail-row"><span className="detail-label">ID</span><span className="detail-value mono">{selectedStaff.id}<button className="copy-btn" onClick={() => copyToClipboard(selectedStaff.id)}><Icons.Copy /></button></span></div>
                                        <div className="detail-row"><span className="detail-label">Email</span><span className="detail-value">{selectedStaff.email}</span></div>
                                        <div className="detail-row"><span className="detail-label">Display Name</span><span className="detail-value">{selectedStaff.displayName}</span></div>
                                        <div className="detail-row"><span className="detail-label">Discord ID</span><span className="detail-value mono">{selectedStaff.discordId || 'Not linked'}{selectedStaff.discordId && <button className="copy-btn" onClick={() => copyToClipboard(selectedStaff.discordId!)}><Icons.Copy /></button>}</span></div>
                                    </div>
                                    <div className="detail-section">
                                        <h4>Authority & Security</h4>
                                        <div className="detail-row"><span className="detail-label">Authority Level</span><span className="detail-value"><span className="authority-badge" style={{ background: `${AUTHORITY_LEVELS[selectedStaff.authorityLevel]?.color}20`, color: AUTHORITY_LEVELS[selectedStaff.authorityLevel]?.color }}>{AUTHORITY_LEVELS[selectedStaff.authorityLevel]?.label} (Level {selectedStaff.authorityLevel})</span></span></div>
                                        <div className="detail-row"><span className="detail-label">MFA Status</span><span className={`detail-value ${selectedStaff.totpEnabled ? 'text-success' : 'text-warning'}`}>{selectedStaff.totpEnabled ? '✓ Enabled' : '✗ Not enabled'}</span></div>
                                        <div className="detail-row"><span className="detail-label">Account Status</span><span className={`detail-value ${selectedStaff.enabled ? 'text-success' : 'text-danger'}`}>{selectedStaff.enabled ? '✓ Active' : '✗ Disabled'}</span></div>
                                    </div>
                                    <div className="detail-section">
                                        <h4>Timestamps</h4>
                                        <div className="detail-row"><span className="detail-label">Created</span><span className="detail-value">{new Date(selectedStaff.createdAt).toLocaleString()}</span></div>
                                        <div className="detail-row"><span className="detail-label">Last Updated</span><span className="detail-value">{new Date(selectedStaff.updatedAt).toLocaleString()}</span></div>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button className="btn-secondary" onClick={() => openUserActivity(selectedStaff.id, selectedStaff.displayName)}><Icons.Eye /> View Activity</button>
                                    <button className="btn-primary" onClick={() => openEditModal(selectedStaff)}><Icons.Edit /> Edit Account</button>
                                </div>
                            </div>
                        )}

                        {/* Edit/Create Modal */}
                        {(modalType === 'edit' || modalType === 'create') && (
                            <div className="modal-body">
                                {error && <div className="alert error">{error}</div>}
                                {success && <div className="alert success">{success}</div>}
                                <div className="form-grid">
                                    <div className="form-group"><label>Email *</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="user@usgrp.xyz" /></div>
                                    <div className="form-group"><label>Display Name *</label><input type="text" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} placeholder="John Smith" /></div>
                                    <div className="form-group"><label>Discord ID</label><input type="text" value={formData.discordId} onChange={e => setFormData({...formData, discordId: e.target.value})} placeholder="123456789012345678" /></div>
                                    <div className="form-group"><label>{modalType === 'create' ? 'Password *' : 'New Password'}</label><input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder={modalType === 'create' ? 'Enter password' : 'Leave blank to keep'} /></div>
                                    <div className="form-group full-width"><label>Authority Level</label><select value={formData.authorityLevel} onChange={e => setFormData({...formData, authorityLevel: parseInt(e.target.value)})}>{Object.entries(AUTHORITY_LEVELS).map(([level, info]) => <option key={level} value={level}>{info.label} (Level {level})</option>)}</select></div>
                                </div>
                                <div className="modal-actions">
                                    <button className="btn-secondary" onClick={closeModal} disabled={saving}>Cancel</button>
                                    <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : modalType === 'create' ? 'Create Account' : 'Save Changes'}</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
                .page-header { margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
                .page-title { font-size: 28px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
                .page-subtitle { font-size: 15px; color: var(--text-muted); }
                .header-actions { display: flex; gap: 12px; align-items: center; }

                .btn-primary { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; border-radius: 8px; color: white; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
                .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
                .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
                .btn-primary :global(svg) { width: 16px; height: 16px; }

                .btn-secondary { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-secondary); font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
                .btn-secondary:hover { background: var(--bg-hover); border-color: var(--border-hover); }
                .btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
                .btn-secondary :global(svg) { width: 16px; height: 16px; }

                .btn-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-muted); cursor: pointer; transition: all 0.15s; }
                .btn-icon:hover { background: var(--bg-hover); color: var(--text-primary); }
                .btn-icon.active { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); color: #10b981; }
                .btn-icon :global(svg) { width: 18px; height: 18px; }

                .btn-danger-sm { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 6px; color: #ef4444; cursor: pointer; transition: all 0.15s; }
                .btn-danger-sm:hover { background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.4); }
                .btn-danger-sm :global(svg) { width: 14px; height: 14px; }

                .stats-row { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
                .stat-item { background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 20px 28px; display: flex; flex-direction: column; gap: 4px; min-width: 140px; }
                .stat-item.highlight { border-left: 3px solid #10b981; }
                .stat-item.success { border-left: 3px solid #10b981; }
                .stat-item.danger { border-left: 3px solid #ef4444; }
                .stat-value { font-size: 28px; font-weight: 700; color: var(--text-primary); }
                .stat-label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }

                .tabs-container { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
                .tab-btn { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: transparent; border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-secondary); font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
                .tab-btn:hover { background: var(--bg-hover); border-color: var(--border-hover); color: var(--text-primary); }
                .tab-btn.active { background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3); color: #60a5fa; }
                .tab-icon { width: 16px; height: 16px; display: flex; }
                .tab-icon :global(svg) { width: 100%; height: 100%; }
                .tab-badge { background: rgba(255, 255, 255, 0.1); padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; }
                .tab-badge.danger { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

                .card-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; border-bottom: 1px solid var(--border-subtle); }
                .card-title { font-size: 16px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
                .card-title :global(svg) { width: 18px; height: 18px; }
                .card-count { font-size: 13px; color: var(--text-muted); display: flex; align-items: center; gap: 8px; }
                .live-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

                /* Staff Table */
                .staff-table { display: flex; flex-direction: column; }
                .table-header, .table-row { display: grid; grid-template-columns: 2fr 1fr 1.5fr 1fr 1fr 100px; align-items: center; padding: 12px 24px; gap: 16px; }
                .table-header { background: var(--bg-hover); font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
                .table-row { border-bottom: 1px solid var(--border-subtle); cursor: pointer; transition: background 0.1s; }
                .table-row:hover { background: var(--bg-hover); }
                .table-row:last-child { border-bottom: none; }
                .user-cell { display: flex; align-items: center; gap: 12px; }
                .staff-avatar { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; font-size: 16px; flex-shrink: 0; }
                .user-info { display: flex; flex-direction: column; gap: 2px; }
                .user-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
                .user-email { font-size: 12px; color: var(--text-muted); }
                .authority-badge { display: inline-flex; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; border: 1px solid; }
                .discord-cell code { font-size: 11px; background: var(--bg-hover); padding: 4px 8px; border-radius: 4px; color: var(--text-secondary); }
                .not-linked { font-size: 12px; color: var(--text-dim); font-style: italic; }
                .security-cell { font-size: 12px; }
                .mfa-enabled { display: flex; align-items: center; gap: 4px; color: #10b981; }
                .mfa-enabled :global(svg) { width: 14px; height: 14px; }
                .mfa-disabled { color: var(--text-dim); }
                .status-badge { display: inline-flex; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; }
                .status-badge.enabled { background: rgba(16, 185, 129, 0.15); color: #10b981; }
                .status-badge.disabled { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
                .actions-cell { display: flex; gap: 8px; }
                .action-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: 6px; color: var(--text-secondary); cursor: pointer; transition: all 0.15s; }
                .action-btn:hover { background: var(--bg-hover); border-color: var(--border-hover); color: var(--text-primary); }
                .action-btn.danger:hover { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #ef4444; }
                .action-btn.success:hover { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); color: #10b981; }
                .action-btn :global(svg) { width: 14px; height: 14px; }

                /* Activity Layout */
                .activity-layout { display: grid; grid-template-columns: 300px 1fr; gap: 24px; }
                .activity-sidebar { display: flex; flex-direction: column; gap: 16px; }
                .activity-log-card { min-height: 500px; }

                .filter-card, .sidebar-card { background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 16px; }
                .filter-card h4, .sidebar-card h4 { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px 0; }
                .filter-card h4 :global(svg), .sidebar-card h4 :global(svg) { width: 14px; height: 14px; }

                .search-input { display: flex; align-items: center; gap: 10px; background: var(--bg-hover); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px 14px; }
                .search-input :global(svg) { width: 16px; height: 16px; color: var(--text-muted); flex-shrink: 0; }
                .search-input input { flex: 1; background: transparent; border: none; color: var(--text-primary); font-size: 14px; outline: none; }
                .search-input input::placeholder { color: var(--text-dim); }

                .filter-group { margin-bottom: 12px; }
                .filter-group:last-child { margin-bottom: 0; }
                .filter-group label { display: block; font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; }
                .filter-group select { width: 100%; padding: 10px 12px; background: var(--bg-hover); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-size: 13px; }

                .user-activity-list { display: flex; flex-direction: column; gap: 8px; }
                .activity-user { display: flex; align-items: center; gap: 10px; padding: 10px; background: var(--bg-hover); border-radius: 8px; cursor: pointer; transition: all 0.15s; }
                .activity-user:hover { background: var(--bg-surface); }
                .activity-user .rank { font-size: 11px; font-weight: 700; color: var(--text-muted); width: 24px; }
                .activity-user .user-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
                .activity-user .name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
                .activity-user .stats { font-size: 11px; color: var(--text-muted); }
                .failed-badge { font-size: 10px; background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 2px 6px; border-radius: 4px; }

                .hourly-chart { display: flex; gap: 2px; height: 60px; align-items: flex-end; }
                .hour-bar { flex: 1; display: flex; flex-direction: column; align-items: center; }
                .hour-bar .bar { width: 100%; min-height: 2px; background: linear-gradient(180deg, #3b82f6, #2563eb); border-radius: 2px 2px 0 0; transition: height 0.3s; }
                .chart-labels { display: flex; justify-content: space-between; margin-top: 8px; font-size: 10px; color: var(--text-dim); }

                /* Activity Log */
                .activity-log { display: flex; flex-direction: column; max-height: 600px; overflow-y: auto; }
                .log-entry { display: flex; gap: 16px; padding: 16px 24px; border-bottom: 1px solid var(--border-subtle); transition: background 0.1s; }
                .log-entry:hover { background: var(--bg-hover); }
                .log-entry:last-child { border-bottom: none; }
                .log-entry.severity-warning { border-left: 3px solid #f59e0b; }
                .log-entry.severity-critical { border-left: 3px solid #ef4444; }
                .log-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .log-icon :global(svg) { width: 16px; height: 16px; }
                .log-content { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
                .log-header { display: flex; align-items: center; gap: 8px; }
                .log-user { font-size: 14px; font-weight: 600; color: var(--text-primary); cursor: pointer; }
                .log-user:hover { text-decoration: underline; }
                .log-action { font-size: 12px; font-weight: 600; }
                .log-details { display: flex; gap: 8px; flex-wrap: wrap; }
                .log-target { font-size: 13px; color: var(--text-secondary); }
                .log-detail { font-size: 12px; color: var(--text-muted); font-style: italic; }
                .log-meta { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; min-width: 120px; flex-shrink: 0; }
                .log-time, .log-ip { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-dim); }
                .log-time :global(svg), .log-ip :global(svg) { width: 12px; height: 12px; }

                /* Sessions */
                .sessions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; padding: 20px; }
                .session-card { background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: 12px; padding: 20px; }
                .session-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
                .session-user { display: flex; align-items: center; gap: 12px; }
                .session-avatar { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; font-size: 16px; }
                .session-name { font-size: 15px; font-weight: 600; color: var(--text-primary); display: block; }
                .session-email { font-size: 12px; color: var(--text-muted); }
                .session-status { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: #10b981; }
                .online-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 2s infinite; }
                .session-details { display: flex; flex-direction: column; gap: 8px; }
                .session-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-secondary); }
                .session-item :global(svg) { width: 16px; height: 16px; color: var(--text-muted); flex-shrink: 0; }
                .session-item.remembered { color: #10b981; }
                .session-footer { margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; }
                .session-created { font-size: 11px; color: var(--text-dim); }

                /* Security */
                .security-layout { display: flex; flex-direction: column; gap: 24px; }
                .alerts-list { display: flex; flex-direction: column; }
                .alert-item { display: flex; gap: 16px; padding: 16px 24px; border-bottom: 1px solid var(--border-subtle); }
                .alert-item:last-child { border-bottom: none; }
                .alert-item.severity-warning { border-left: 3px solid #f59e0b; }
                .alert-item.severity-critical { border-left: 3px solid #ef4444; background: rgba(239, 68, 68, 0.03); }
                .alert-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .alert-icon :global(svg) { width: 18px; height: 18px; }
                .alert-content { flex: 1; }
                .alert-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
                .alert-user { font-size: 14px; font-weight: 600; color: var(--text-primary); }
                .alert-action { font-size: 12px; font-weight: 600; color: #ef4444; }
                .alert-details { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
                .alert-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
                .alert-badge.danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
                .alert-detail { font-size: 12px; color: var(--text-muted); }
                .alert-ip { font-size: 11px; color: var(--text-dim); font-family: var(--font-mono); }
                .alert-time { font-size: 12px; color: var(--text-dim); flex-shrink: 0; }

                .login-chart-detailed { display: flex; gap: 8px; padding: 20px 24px; align-items: flex-end; height: 180px; }
                .chart-day { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; }
                .bar-stack { display: flex; flex-direction: column; width: 100%; border-radius: 4px 4px 0 0; overflow: hidden; }
                .bar-segment { width: 100%; min-height: 4px; }
                .bar-segment.sso { background: #3b82f6; }
                .bar-segment.success { background: #10b981; }
                .bar-segment.failed { background: #ef4444; }
                .day-label { font-size: 10px; color: var(--text-muted); }
                .chart-legend { display: flex; gap: 16px; justify-content: center; padding: 16px; border-top: 1px solid var(--border-subtle); }
                .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); }
                .legend-item .dot { width: 10px; height: 10px; border-radius: 2px; }
                .legend-item .dot.sso { background: #3b82f6; }
                .legend-item .dot.success { background: #10b981; }
                .legend-item .dot.failed { background: #ef4444; }

                .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; text-align: center; gap: 12px; }
                .empty-state :global(svg) { width: 48px; height: 48px; color: var(--text-dim); }
                .empty-state.success :global(svg) { color: #10b981; }
                .empty-state p { font-size: 15px; color: var(--text-secondary); margin: 0; }
                .empty-state span { font-size: 13px; color: var(--text-muted); }

                /* Modal */
                .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
                .modal { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 16px; width: 100%; max-width: 600px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }
                .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border-subtle); }
                .modal-header h2 { font-size: 18px; font-weight: 600; color: var(--text-primary); margin: 0; }
                .modal-close { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: var(--text-muted); cursor: pointer; border-radius: 6px; transition: all 0.15s; }
                .modal-close:hover { background: var(--bg-hover); color: var(--text-primary); }
                .modal-close :global(svg) { width: 18px; height: 18px; }
                .modal-body { padding: 24px; overflow-y: auto; }
                .modal-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 24px; border-top: 1px solid var(--border-subtle); margin-top: 24px; }

                .user-activity-modal { max-height: 400px; overflow-y: auto; }
                .activity-log.compact .log-entry.compact { display: grid; grid-template-columns: 1fr 2fr auto; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border-subtle); }
                .log-action-sm { font-size: 12px; font-weight: 600; }
                .log-target-sm { font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .log-time-sm { font-size: 11px; color: var(--text-dim); }

                .detail-grid { display: flex; flex-direction: column; gap: 24px; }
                .detail-section h4 { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px 0; }
                .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-subtle); }
                .detail-row:last-child { border-bottom: none; }
                .detail-label { font-size: 13px; color: var(--text-muted); }
                .detail-value { font-size: 13px; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
                .detail-value.mono { font-family: var(--font-mono); font-size: 12px; }
                .text-success { color: #10b981; }
                .text-warning { color: #f59e0b; }
                .text-danger { color: #ef4444; }
                .copy-btn { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: var(--text-muted); cursor: pointer; border-radius: 4px; transition: all 0.15s; }
                .copy-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
                .copy-btn :global(svg) { width: 14px; height: 14px; }

                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .form-group { display: flex; flex-direction: column; gap: 6px; }
                .form-group.full-width { grid-column: span 2; }
                .form-group label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
                .form-group input, .form-group select { padding: 10px 14px; background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: 8px; color: var(--text-primary); font-size: 14px; transition: all 0.15s; }
                .form-group input:focus, .form-group select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
                .form-group input::placeholder { color: var(--text-dim); }

                .alert { padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
                .alert.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
                .alert.success { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }

                @media (max-width: 1100px) { .activity-layout { grid-template-columns: 1fr; } .activity-sidebar { flex-direction: row; flex-wrap: wrap; } .filter-card, .sidebar-card { flex: 1; min-width: 200px; } }
                @media (max-width: 900px) { .table-header, .table-row { grid-template-columns: 2fr 1fr 1fr; } .table-header span:nth-child(3), .table-row > div:nth-child(3), .table-header span:nth-child(4), .table-row > div:nth-child(4) { display: none; } .form-grid { grid-template-columns: 1fr; } .form-group.full-width { grid-column: span 1; } .stats-row { flex-wrap: wrap; } .stat-item { min-width: 120px; } }
            `}</style>
        </div>
    );
}
