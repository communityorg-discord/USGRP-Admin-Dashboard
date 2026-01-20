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
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)' }}>
                <div className="text-cyan-400 animate-pulse text-xl">Loading...</div>
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

    const actionTypeColors: Record<string, string> = {
        warn: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        mute: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
        kick: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        ban: 'bg-red-600/20 text-red-300 border-red-600/30',
        note: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    };

    return (
        <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)' }}>
            {/* Sidebar */}
            <aside className="w-72 flex-shrink-0 flex flex-col" style={{ background: 'rgba(15, 15, 26, 0.8)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                {/* Logo */}
                <div className="p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(147, 51, 234, 0.2))', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                            🛡️
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">USGRP Admin</h1>
                            <p className="text-xs text-gray-500">admin.usgrp.xyz</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 ${item.active
                                    ? 'text-cyan-400'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            style={item.active ? {
                                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(147, 51, 234, 0.1))',
                                border: '1px solid rgba(6, 182, 212, 0.3)',
                                boxShadow: '0 0 20px rgba(6, 182, 212, 0.1)'
                            } : undefined}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}

                    <div className="pt-4 mt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <a href="https://mail.usgrp.xyz" target="_blank" className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                            <span className="text-lg">📧</span>
                            <span>Webmail</span>
                        </a>
                    </div>
                </nav>

                {/* User info */}
                <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="p-4 rounded-xl mb-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <p className="text-gray-400 text-sm truncate">{session?.email}</p>
                        <p className="text-xs mt-1" style={{ color: session?.permissionName === 'BOT_DEVELOPER' ? '#22d3ee' : session?.permissionName === 'SUPERUSER' ? '#a78bfa' : '#6b7280' }}>
                            {session?.permissionName || 'MODERATOR'}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-medium"
                    >
                        <span>🚪</span> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex items-start justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
                            <p className="text-gray-500">Welcome back! Here&apos;s your server overview.</p>
                        </div>
                        {!apiConnected && (
                            <div className="px-4 py-2 rounded-xl text-sm" style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', color: '#fbbf24' }}>
                                ⚠️ Bot API not connected
                            </div>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        {[
                            { label: 'Total Cases', value: stats?.cases.total ?? '-', icon: '📋', gradient: 'from-blue-500 to-cyan-400' },
                            { label: 'Active Warns', value: stats?.cases.warns ?? '-', icon: '⚠️', gradient: 'from-amber-500 to-yellow-400' },
                            { label: 'Messages', value: stats?.activity.messages?.toLocaleString() ?? '-', icon: '💬', gradient: 'from-purple-500 to-pink-400' },
                            { label: 'Staff', value: stats?.staff ?? '-', icon: '👥', gradient: 'from-emerald-500 to-green-400' },
                            { label: 'Open Tickets', value: stats?.tickets.open ?? '-', icon: '🎫', gradient: 'from-rose-500 to-red-400' },
                            { label: 'Members', value: stats?.members?.toLocaleString() ?? '-', icon: '🏠', gradient: 'from-indigo-500 to-violet-400' },
                        ].map((stat, i) => (
                            <div key={i} className="relative p-5 rounded-2xl overflow-hidden group" style={{ background: 'rgba(20, 20, 35, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
                                <span className="text-2xl">{stat.icon}</span>
                                <p className={`text-3xl font-bold mt-3 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                                    {stat.value}
                                </p>
                                <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Recent Cases */}
                        <div className="rounded-2xl p-6" style={{ background: 'rgba(20, 20, 35, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-semibold text-white">Recent Cases</h2>
                                <Link href="/cases" className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors">View all →</Link>
                            </div>
                            <div className="space-y-3">
                                {recentCases.length > 0 ? recentCases.slice(0, 5).map((c) => (
                                    <div key={c.case_id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${actionTypeColors[c.action_type] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
                                                {c.action_type.toUpperCase()}
                                            </span>
                                            <div>
                                                <p className="text-white font-medium">{c.user_tag}</p>
                                                <p className="text-gray-500 text-xs truncate max-w-[180px]">{c.reason || 'No reason'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-gray-400 text-sm font-mono">{c.case_id}</p>
                                            <p className="text-gray-600 text-xs">{new Date(c.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-12 text-gray-500">
                                        {apiConnected ? 'No cases found' : 'Connect bot API to see cases'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="rounded-2xl p-6" style={{ background: 'rgba(20, 20, 35, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <h2 className="text-lg font-semibold text-white mb-5">Quick Actions</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'User Lookup', desc: 'Search & view history', icon: '🔍', href: '/users' },
                                    { label: 'Cases', desc: 'Browse all cases', icon: '📋', href: '/cases' },
                                    { label: 'Analytics', desc: 'Growth & activity', icon: '📈', href: '/analytics' },
                                    { label: 'Appeals', desc: 'Review requests', icon: '⚖️', href: '/appeals' },
                                ].map((action, i) => (
                                    <Link key={i} href={action.href} className="group p-4 rounded-xl transition-all duration-200 hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span className="text-2xl">{action.icon}</span>
                                        <p className="font-medium text-white mt-2 group-hover:text-cyan-400 transition-colors">{action.label}</p>
                                        <p className="text-gray-500 text-xs mt-0.5">{action.desc}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Services Status */}
                    <div className="rounded-2xl p-6" style={{ background: 'rgba(20, 20, 35, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h2 className="text-lg font-semibold text-white mb-5">Services Status</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { name: 'CO Gov-Utils Bot', status: apiConnected },
                                { name: 'Admin API', status: apiConnected },
                                { name: 'Recording Server', url: 'https://recordings.usgrp.xyz', status: true },
                                { name: 'Mail Server', url: 'https://mail.usgrp.xyz', status: true },
                            ].map((service, i) => (
                                <div key={i} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <span className={`w-2.5 h-2.5 rounded-full ${service.status ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`} />
                                    <span className="text-gray-300 flex-1">{service.name}</span>
                                    {service.url && (
                                        <a href={service.url} target="_blank" className="text-cyan-400 text-sm hover:text-cyan-300">→</a>
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
