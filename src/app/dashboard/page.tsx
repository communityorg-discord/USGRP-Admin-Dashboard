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
        // Check auth and sync permissions
        Promise.all([
            fetch('/api/auth/session').then(r => r.json()),
            fetch('/api/bot/permissions', { method: 'POST' }).then(r => r.json()).catch(() => null)
        ]).then(async ([authData, permData]) => {
            if (!authData.authenticated) {
                router.push('/');
                return;
            }

            // Merge session with permissions
            setSession({
                ...authData,
                permissionLevel: permData?.permissionLevel || 1,
                permissionName: permData?.permissionName || 'MODERATOR',
                discordId: permData?.discordId
            });

            // Fetch stats from server-side proxy
            try {
                const statsRes = await fetch('/api/bot/stats');
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    setStats(statsData);
                    setApiConnected(true);
                }
            } catch (e) {
                console.log('Bot API not available');
            }

            // Fetch recent cases
            try {
                const casesRes = await fetch('/api/bot/cases');
                if (casesRes.ok) {
                    const casesData = await casesRes.json();
                    setRecentCases(casesData);
                }
            } catch (e) {
                console.log('Could not fetch cases');
            }

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
                <div className="text-cyan-400 animate-pulse text-xl">Loading...</div>
            </div>
        );
    }

    const statCards = stats ? [
        { label: 'Total Cases', value: stats.cases.total.toString(), icon: '📋', color: 'from-blue-500 to-cyan-500' },
        { label: 'Active Warns', value: stats.cases.warns.toString(), icon: '⚠️', color: 'from-yellow-500 to-orange-500' },
        { label: 'Messages (30d)', value: stats.activity.messages.toLocaleString(), icon: '💬', color: 'from-purple-500 to-pink-500' },
        { label: 'Staff Accounts', value: stats.staff.toString(), icon: '👥', color: 'from-green-500 to-emerald-500' },
        { label: 'Open Tickets', value: stats.tickets.open.toString(), icon: '🎫', color: 'from-red-500 to-pink-500' },
        { label: 'Server Members', value: stats.members.toLocaleString(), icon: '🏠', color: 'from-indigo-500 to-purple-500' },
    ] : [
        { label: 'Total Cases', value: '-', icon: '📋', color: 'from-blue-500 to-cyan-500' },
        { label: 'Active Warns', value: '-', icon: '⚠️', color: 'from-yellow-500 to-orange-500' },
        { label: 'Messages', value: '-', icon: '💬', color: 'from-purple-500 to-pink-500' },
        { label: 'Staff', value: '-', icon: '👥', color: 'from-green-500 to-emerald-500' },
        { label: 'Tickets', value: '-', icon: '🎫', color: 'from-red-500 to-pink-500' },
        { label: 'Members', value: '-', icon: '🏠', color: 'from-indigo-500 to-purple-500' },
    ];

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
        warn: 'bg-yellow-500/20 text-yellow-400',
        mute: 'bg-orange-500/20 text-orange-400',
        kick: 'bg-red-500/20 text-red-400',
        ban: 'bg-red-700/20 text-red-300',
        note: 'bg-blue-500/20 text-blue-400',
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex">
            {/* Sidebar */}
            <aside className="w-72 bg-[#0d0d14] border-r border-white/5 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🛡️</span>
                        <div>
                            <h1 className="text-xl font-bold text-white">USGRP Admin</h1>
                            <p className="text-xs text-gray-500">admin.usgrp.xyz</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${item.active
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}

                    <div className="pt-4 mt-4 border-t border-white/5">
                        <a
                            href="https://mail.usgrp.xyz"
                            target="_blank"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                        >
                            <span className="text-lg">📧</span>
                            <span className="font-medium">Webmail</span>
                        </a>
                    </div>
                </nav>

                {/* User info */}
                <div className="p-4 border-t border-white/5">
                    <div className="px-4 py-2 text-sm text-gray-400 truncate mb-2">
                        {session?.email}
                    </div>
                    <div className="px-4 py-1 text-xs text-cyan-400 mb-2">
                        {session?.permissionName || 'MODERATOR'}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <span>🚪</span>
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
                            <p className="text-gray-500">Welcome back! Here&apos;s your server overview.</p>
                        </div>
                        {!apiConnected && (
                            <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-sm">
                                ⚠️ Bot API not connected
                            </div>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        {statCards.map((stat, i) => (
                            <div
                                key={i}
                                className="relative overflow-hidden rounded-2xl bg-[#12121a] border border-white/5 p-5"
                            >
                                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-10 blur-2xl`}></div>
                                <div className="relative">
                                    <span className="text-2xl">{stat.icon}</span>
                                    <p className={`text-2xl font-bold mt-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                                        {stat.value}
                                    </p>
                                    <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Cases */}
                        <div className="bg-[#12121a] border border-white/5 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">Recent Cases</h2>
                                <Link href="/cases" className="text-cyan-400 text-sm hover:underline">View all →</Link>
                            </div>
                            <div className="space-y-3">
                                {recentCases.length > 0 ? recentCases.map((c) => (
                                    <div key={c.case_id} className="flex items-center justify-between py-3 px-4 bg-white/5 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${actionTypeColors[c.action_type] || 'bg-gray-500/20 text-gray-400'}`}>
                                                {c.action_type.toUpperCase()}
                                            </span>
                                            <div>
                                                <p className="text-white font-medium">{c.user_tag}</p>
                                                <p className="text-gray-500 text-xs truncate max-w-[150px]">{c.reason}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-gray-400 text-sm">{c.case_id}</p>
                                            <p className="text-gray-600 text-xs">{new Date(c.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-gray-500 text-center py-8">Connect bot API to see cases</p>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-[#12121a] border border-white/5 rounded-2xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-2 gap-3">
                                <Link href="/users" className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                                    <span className="text-2xl">🔍</span>
                                    <div>
                                        <p className="font-medium text-white">User Lookup</p>
                                        <p className="text-gray-500 text-xs">Search & view history</p>
                                    </div>
                                </Link>
                                <Link href="/cases" className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                                    <span className="text-2xl">📋</span>
                                    <div>
                                        <p className="font-medium text-white">Cases</p>
                                        <p className="text-gray-500 text-xs">Browse all cases</p>
                                    </div>
                                </Link>
                                <Link href="/analytics" className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                                    <span className="text-2xl">📈</span>
                                    <div>
                                        <p className="font-medium text-white">Analytics</p>
                                        <p className="text-gray-500 text-xs">Growth & activity</p>
                                    </div>
                                </Link>
                                <Link href="/appeals" className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                                    <span className="text-2xl">⚖️</span>
                                    <div>
                                        <p className="font-medium text-white">Appeals</p>
                                        <p className="text-gray-500 text-xs">Review requests</p>
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Services Status */}
                    <div className="mt-6 bg-[#12121a] border border-white/5 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Services Status</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { name: 'CO Gov-Utils Bot', status: apiConnected },
                                { name: 'Admin API', status: apiConnected },
                                { name: 'Recording Server', url: 'https://recordings.usgrp.xyz' },
                                { name: 'Mail Server', url: 'https://mail.usgrp.xyz' },
                            ].map((service, i) => (
                                <div key={i} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                                    <span className={`w-3 h-3 rounded-full ${service.status !== false ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    <span className="text-gray-300">{service.name}</span>
                                    {service.url && (
                                        <a href={service.url} target="_blank" className="ml-auto text-cyan-400 text-sm">→</a>
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
