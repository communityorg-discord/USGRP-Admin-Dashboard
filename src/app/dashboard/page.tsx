'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserSession {
    authenticated: boolean;
    email?: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [session, setSession] = useState<UserSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                if (!data.authenticated) {
                    router.push('/');
                } else {
                    setSession(data);
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                <div className="text-cyan-400 animate-pulse text-xl">Loading...</div>
            </div>
        );
    }

    const stats = [
        { label: 'Active Commands', value: '50+', icon: '⚡', gradient: 'from-cyan-500 to-blue-500' },
        { label: 'Pending Appeals', value: '3', icon: '📝', gradient: 'from-yellow-500 to-orange-500' },
        { label: 'Recordings', value: '12', icon: '🎙️', gradient: 'from-purple-500 to-pink-500' },
        { label: 'Backups', value: '7', icon: '💾', gradient: 'from-green-500 to-emerald-500' },
    ];

    const quickActions = [
        { label: 'View Commands', href: '/commands', icon: '📋', desc: 'Browse all bot commands' },
        { label: 'Recordings', href: 'https://recordings.usgrp.xyz', icon: '🎙️', desc: 'Voice recording archive' },
        { label: 'Manage Appeals', href: '/appeals', icon: '⚖️', desc: 'Review ban appeals' },
        { label: 'Backups', href: '/backups', icon: '💾', desc: 'Server backup management' },
    ];

    const services = [
        { name: 'CO Gov-Utils Bot', status: 'online', url: null },
        { name: 'CO Economy Bot', status: 'online', url: null },
        { name: 'Recording Server', status: 'online', url: 'https://recordings.usgrp.xyz' },
        { name: 'Mail Server', status: 'online', url: 'https://mail.usgrp.xyz' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
            {/* Sidebar */}
            <aside className="w-64 min-h-screen p-4 flex flex-col bg-slate-950/80 border-r border-white/5">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">🛡️</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">USGRP Admin</span>
                    </div>
                    <p className="text-xs text-slate-500 pl-12">admin.usgrp.xyz</p>
                </div>

                <nav className="flex-1 space-y-1">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <span>📊</span> Dashboard
                    </Link>
                    <Link href="/commands" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all">
                        <span>📋</span> Commands
                    </Link>
                    <Link href="/appeals" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all">
                        <span>⚖️</span> Appeals
                    </Link>
                    <a href="https://recordings.usgrp.xyz" target="_blank" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all">
                        <span>🎙️</span> Recordings
                    </a>
                    <Link href="/backups" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all">
                        <span>💾</span> Backups
                    </Link>

                    <div className="pt-4 mt-4 border-t border-white/5">
                        <a href="https://mail.usgrp.xyz" target="_blank" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all">
                            <span>📧</span> Webmail
                        </a>
                    </div>
                </nav>

                <div className="pt-4 border-t border-white/5">
                    <div className="px-4 py-2 text-sm text-slate-500 truncate">
                        {session?.email}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all w-full"
                    >
                        <span>🚪</span> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-auto">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Welcome back</h1>
                        <p className="text-slate-500">Manage your government utilities from one place</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {stats.map((stat, i) => (
                            <div key={i} className="relative overflow-hidden rounded-2xl bg-slate-900/50 border border-white/5 p-6 backdrop-blur-xl hover:border-white/10 transition-all group">
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-3xl">{stat.icon}</span>
                                        <span className={`text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>{stat.value}</span>
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <h2 className="text-xl font-semibold mb-4 text-white">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {quickActions.map((action, i) => (
                            <Link
                                key={i}
                                href={action.href}
                                target={action.href.startsWith('http') ? '_blank' : undefined}
                                className="group flex items-center gap-5 p-6 rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-xl hover:bg-slate-800/50 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300"
                            >
                                <span className="text-4xl group-hover:scale-110 transition-transform">{action.icon}</span>
                                <div>
                                    <h3 className="font-semibold text-lg text-white group-hover:text-cyan-400 transition-colors">{action.label}</h3>
                                    <p className="text-slate-500 text-sm">{action.desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Services Status */}
                    <h2 className="text-xl font-semibold mb-4 text-white">Services Status</h2>
                    <div className="rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-xl p-6">
                        <div className="space-y-1">
                            {services.map((service, i) => (
                                <div key={i} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-white/5 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-2.5 h-2.5 rounded-full ${service.status === 'online' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'}`}></span>
                                        <span className="text-slate-300">{service.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-sm font-medium ${service.status === 'online' ? 'text-green-400' : 'text-red-400'}`}>
                                            {service.status === 'online' ? 'Online' : 'Offline'}
                                        </span>
                                        {service.url && (
                                            <a
                                                href={service.url}
                                                target="_blank"
                                                className="text-cyan-400 text-sm hover:text-cyan-300 font-medium transition-colors"
                                            >
                                                Open →
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
