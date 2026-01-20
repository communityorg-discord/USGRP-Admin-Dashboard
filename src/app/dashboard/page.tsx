'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Stats {
    cases: { total: number; warns: number; mutes: number; kicks: number; bans: number; active: number };
    tickets: { total: number; open: number; closed: number };
    activity: { messages: number; voiceMinutes: number; uniqueUsers: number };
    staff: number;
    members: number;
}

interface Case {
    case_id: string;
    user_tag: string;
    action_type: string;
    reason: string;
    created_at: string;
    moderator_tag: string;
}

interface UserSession {
    authenticated: boolean;
    email?: string;
    discordId?: string;
    permissionLevel?: number;
    permissionName?: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [session, setSession] = useState<UserSession | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentCases, setRecentCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiConnected, setApiConnected] = useState(false);

    useEffect(() => {
        Promise.all([
            fetch('/api/auth/session').then(r => r.json()),
            fetch('/api/bot/permissions', { method: 'POST' }).then(r => r.json()).catch(() => null)
        ]).then(async ([authData, permData]) => {
            if (!authData.authenticated) {
                router.push('/');
                return;
            }

            setSession({
                ...authData,
                permissionLevel: permData?.permissionLevel || 1,
                permissionName: permData?.permissionName || 'MODERATOR',
                discordId: permData?.discordId
            });

            try {
                const statsRes = await fetch('/api/bot/stats');
                if (statsRes.ok) {
                    setStats(await statsRes.json());
                    setApiConnected(true);
                }
            } catch { }

            try {
                const casesRes = await fetch('/api/bot/cases');
                if (casesRes.ok) {
                    setRecentCases(await casesRes.json());
                }
            } catch { }

            setLoading(false);
        });
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="text-[#00d4ff] animate-pulse text-xl">Loading...</div>
            </div>
        );
    }

    const navItems = [
        { label: 'Dashboard', href: '/dashboard', icon: '📊', active: true },
        { label: 'Users', href: '/users', icon: '👤' },
        { label: 'Cases', href: '/cases', icon: '📋' },
        { label: 'Tickets', href: '/tickets', icon: '🎫' },
        { label: 'Analytics', href: '/analytics', icon: '📈' },
        { label: 'Staff', href: '/staff-dashboard', icon: '👥' },
        { label: 'Appeals', href: '/appeals', icon: '⚖️' },
        { label: 'Backups', href: '/backups', icon: '💾' },
    ];

    return (
        <div className="min-h-screen flex bg-[#0a0a0f]">
            {/* Sidebar */}
            <aside className="sidebar w-64 min-h-screen flex flex-col">
                {/* Logo */}
                <div className="p-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#00d4ff]/20 flex items-center justify-center text-xl border border-[#00d4ff]/30">
                            🛡️
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">USGRP Admin</h1>
                            <p className="text-xs text-gray-500">admin.usgrp.xyz</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={item.active ? 'sidebar-link active' : 'sidebar-link'}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}

                    <div className="pt-3 mt-3 border-t border-white/10">
                        <a href="https://mail.usgrp.xyz" target="_blank" className="sidebar-link">
                            <span className="text-lg">📧</span>
                            <span>Webmail</span>
                        </a>
                    </div>
                </nav>

                {/* User info */}
                <div className="p-4 border-t border-white/10">
                    <div className="glass-card p-3 mb-3">
                        <p className="text-gray-400 text-sm truncate">{session?.email}</p>
                        <p className="text-xs mt-1 text-[#00d4ff] font-medium">{session?.permissionName || 'MODERATOR'}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-medium">
                        <span>🚪</span> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-auto">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-6 flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
                            <p className="text-gray-500">Welcome back! Here&apos;s your server overview.</p>
                        </div>
                        {!apiConnected && (
                            <div className="px-3 py-2 rounded-lg text-sm bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                                ⚠️ Bot API not connected
                            </div>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                        {[
                            { label: 'Total Cases', value: stats?.cases.total ?? '-', icon: '📋', color: '#3b82f6' },
                            { label: 'Warns', value: stats?.cases.warns ?? '-', icon: '⚠️', color: '#f59e0b' },
                            { label: 'Messages', value: stats?.activity.messages?.toLocaleString() ?? '-', icon: '💬', color: '#a855f7' },
                            { label: 'Staff', value: stats?.staff ?? '-', icon: '👥', color: '#22c55e' },
                            { label: 'Tickets', value: stats?.tickets.open ?? '-', icon: '🎫', color: '#ef4444' },
                            { label: 'Members', value: stats?.members?.toLocaleString() ?? '-', icon: '🏠', color: '#6366f1' },
                        ].map((stat, i) => (
                            <div key={i} className="glass-card glass-card-hover p-4">
                                <span className="text-xl">{stat.icon}</span>
                                <p className="text-2xl font-bold mt-2" style={{ color: stat.color }}>{stat.value}</p>
                                <p className="text-gray-500 text-xs mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        {/* Recent Cases */}
                        <div className="glass-card p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-semibold text-white">Recent Cases</h2>
                                <Link href="/cases" className="text-[#00d4ff] text-sm hover:underline">View all →</Link>
                            </div>
                            <div className="space-y-2">
                                {recentCases.length > 0 ? recentCases.slice(0, 5).map((c) => (
                                    <div key={c.case_id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold badge-${c.action_type}`}>
                                                {c.action_type.toUpperCase()}
                                            </span>
                                            <div>
                                                <p className="text-white text-sm font-medium">{c.user_tag}</p>
                                                <p className="text-gray-500 text-xs truncate max-w-[150px]">{c.reason || 'No reason'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-gray-400 text-xs font-mono">{c.case_id}</p>
                                            <p className="text-gray-600 text-xs">{new Date(c.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-gray-500 text-sm">
                                        {apiConnected ? 'No cases found' : 'Connect bot API to see cases'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="glass-card p-5">
                            <h2 className="text-base font-semibold text-white mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { label: 'User Lookup', desc: 'Search & view history', icon: '🔍', href: '/users' },
                                    { label: 'Cases', desc: 'Browse all cases', icon: '📋', href: '/cases' },
                                    { label: 'Analytics', desc: 'Growth & activity', icon: '📈', href: '/analytics' },
                                    { label: 'Appeals', desc: 'Review requests', icon: '⚖️', href: '/appeals' },
                                ].map((action, i) => (
                                    <Link key={i} href={action.href} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                                        <span className="text-xl">{action.icon}</span>
                                        <p className="font-medium text-white text-sm mt-1">{action.label}</p>
                                        <p className="text-gray-500 text-xs">{action.desc}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Services Status */}
                    <div className="glass-card p-5">
                        <h2 className="text-base font-semibold text-white mb-4">Services Status</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { name: 'Bot', status: apiConnected },
                                { name: 'Admin API', status: apiConnected },
                                { name: 'Recordings', url: 'https://recordings.usgrp.xyz', status: true },
                                { name: 'Mail', url: 'https://mail.usgrp.xyz', status: true },
                            ].map((service, i) => (
                                <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
                                    <span className={`w-2 h-2 rounded-full ${service.status ? 'bg-green-400' : 'bg-red-500'}`} />
                                    <span className="text-gray-300 flex-1 text-sm">{service.name}</span>
                                    {service.url && (
                                        <a href={service.url} target="_blank" className="text-[#00d4ff] text-xs">→</a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
