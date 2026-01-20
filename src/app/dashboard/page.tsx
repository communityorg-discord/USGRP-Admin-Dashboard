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
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="text-cyan-400 animate-pulse text-xl">Loading...</div>
            </div>
        );
    }

    const stats = [
        { label: 'Active Commands', value: '50+', icon: '⚡', color: 'cyan' },
        { label: 'Pending Appeals', value: '3', icon: '📝', color: 'yellow' },
        { label: 'Recordings', value: '12', icon: '🎙️', color: 'purple' },
        { label: 'Backups', value: '7', icon: '💾', color: 'green' },
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
        <div className="min-h-screen bg-[#0a0a0f] flex">
            {/* Sidebar */}
            <aside className="sidebar w-64 min-h-screen p-4 flex flex-col">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">🛡️</span>
                        <span className="text-xl font-bold gradient-text">USGRP Admin</span>
                    </div>
                    <p className="text-xs text-gray-500 pl-12">admin.usgrp.xyz</p>
                </div>

                <nav className="flex-1 space-y-2">
                    <Link href="/dashboard" className="sidebar-link active">
                        <span>📊</span> Dashboard
                    </Link>
                    <Link href="/commands" className="sidebar-link">
                        <span>📋</span> Commands
                    </Link>
                    <Link href="/appeals" className="sidebar-link">
                        <span>⚖️</span> Appeals
                    </Link>
                    <a href="https://recordings.usgrp.xyz" target="_blank" className="sidebar-link">
                        <span>🎙️</span> Recordings
                    </a>
                    <Link href="/backups" className="sidebar-link">
                        <span>💾</span> Backups
                    </Link>

                    <div className="pt-4 mt-4 border-t border-white/10">
                        <a href="https://mail.usgrp.xyz" target="_blank" className="sidebar-link">
                            <span>📧</span> Webmail
                        </a>
                    </div>
                </nav>

                <div className="pt-4 border-t border-white/10">
                    <div className="px-3 py-2 text-sm text-gray-500 truncate">
                        {session?.email}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="sidebar-link w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                        <span>🚪</span> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
                        <p className="text-gray-500">Manage your government utilities from one place</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {stats.map((stat, i) => (
                            <div key={i} className="glass-card p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-3xl">{stat.icon}</span>
                                    <span className={`text-3xl font-bold ${stat.color === 'cyan' ? 'text-cyan-400' :
                                            stat.color === 'yellow' ? 'text-yellow-400' :
                                                stat.color === 'purple' ? 'text-purple-400' :
                                                    'text-green-400'
                                        }`}>{stat.value}</span>
                                </div>
                                <p className="text-gray-400 text-sm">{stat.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        {quickActions.map((action, i) => (
                            <Link
                                key={i}
                                href={action.href}
                                target={action.href.startsWith('http') ? '_blank' : undefined}
                                className="glass-card glass-card-hover p-6 flex items-center gap-4"
                            >
                                <span className="text-4xl">{action.icon}</span>
                                <div>
                                    <h3 className="font-semibold text-lg">{action.label}</h3>
                                    <p className="text-gray-500 text-sm">{action.desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Services Status */}
                    <h2 className="text-xl font-semibold mb-4">Services Status</h2>
                    <div className="glass-card p-6">
                        <div className="space-y-4">
                            {services.map((service, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-3 h-3 rounded-full ${service.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                                            }`}></span>
                                        <span>{service.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-sm ${service.status === 'online' ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            {service.status === 'online' ? 'Online' : 'Offline'}
                                        </span>
                                        {service.url && (
                                            <a
                                                href={service.url}
                                                target="_blank"
                                                className="text-cyan-400 text-sm hover:underline"
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
