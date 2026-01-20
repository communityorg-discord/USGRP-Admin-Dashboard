'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

const API_KEY = 'usgrp-admin-2026-secure-key-x7k9m2p4';

export default function UsersPage() {
    const router = useRouter();
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
            const res = await fetch(`http://localhost:3003/api/users/${searchId}`, {
                headers: { 'X-Admin-Key': API_KEY }
            });

            if (!res.ok) throw new Error('User not found');

            const data = await res.json();
            setUser(data);
        } catch (e) {
            setError('Could not fetch user. Make sure bot API is running.');
        } finally {
            setLoading(false);
        }
    };

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
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🛡️</span>
                        <div>
                            <h1 className="text-xl font-bold text-white">USGRP Admin</h1>
                            <p className="text-xs text-gray-500">admin.usgrp.xyz</p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all">
                        <span>📊</span> Dashboard
                    </Link>
                    <Link href="/users" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <span>👤</span> Users
                    </Link>
                    <Link href="/cases" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all">
                        <span>📋</span> Cases
                    </Link>
                    <Link href="/analytics" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all">
                        <span>📈</span> Analytics
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-2">User Lookup</h1>
                    <p className="text-gray-500 mb-8">Search by Discord ID to view moderation history</p>

                    {/* Search */}
                    <div className="flex gap-4 mb-8">
                        <input
                            type="text"
                            placeholder="Enter Discord User ID..."
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1 px-4 py-3 bg-[#12121a] border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="px-6 py-3 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 disabled:opacity-50 transition-all"
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-8">
                            {error}
                        </div>
                    )}

                    {/* User Results */}
                    {user && (
                        <div className="space-y-6">
                            {/* User Card */}
                            <div className="bg-[#12121a] border border-white/5 rounded-2xl p-6">
                                <div className="flex items-start gap-6">
                                    {user.user.avatar ? (
                                        <img src={user.user.avatar} alt="" className="w-20 h-20 rounded-full" />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl">👤</div>
                                    )}
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-white">
                                            {user.user.displayName || user.user.username || 'Unknown User'}
                                        </h2>
                                        <p className="text-gray-500">@{user.user.username}</p>
                                        <p className="text-gray-600 text-sm mt-1">ID: {user.user.id}</p>

                                        {user.user.roles && user.user.roles.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {user.user.roles.slice(0, 5).map((role) => (
                                                    <span key={role.id} className="px-2 py-1 text-xs rounded" style={{ backgroundColor: role.color + '20', color: role.color }}>
                                                        {role.name}
                                                    </span>
                                                ))}
                                                {user.user.roles.length > 5 && (
                                                    <span className="px-2 py-1 text-xs rounded bg-gray-700 text-gray-400">
                                                        +{user.user.roles.length - 5} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-3 bg-white/5 rounded-xl">
                                            <p className="text-2xl font-bold text-cyan-400">{user.caseCount}</p>
                                            <p className="text-gray-500 text-xs">Cases</p>
                                        </div>
                                        <div className="text-center p-3 bg-white/5 rounded-xl">
                                            <p className="text-2xl font-bold text-purple-400">{user.activity.totalMessages}</p>
                                            <p className="text-gray-500 text-xs">Messages</p>
                                        </div>
                                        <div className="text-center p-3 bg-white/5 rounded-xl">
                                            <p className="text-2xl font-bold text-green-400">{Math.round(user.activity.totalVoice / 60)}h</p>
                                            <p className="text-gray-500 text-xs">Voice</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cases */}
                            <div className="bg-[#12121a] border border-white/5 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Moderation History</h3>
                                {user.cases.length > 0 ? (
                                    <div className="space-y-3">
                                        {user.cases.map((c) => (
                                            <div key={c.case_id} className="flex items-center justify-between py-3 px-4 bg-white/5 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${actionTypeColors[c.action_type] || 'bg-gray-500/20'}`}>
                                                        {c.action_type.toUpperCase()}
                                                    </span>
                                                    <div>
                                                        <p className="text-white">{c.reason || 'No reason'}</p>
                                                        <p className="text-gray-500 text-xs">By {c.moderator_tag}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-gray-400 text-sm">{c.case_id}</p>
                                                    <p className="text-gray-600 text-xs">{new Date(c.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No moderation history</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
