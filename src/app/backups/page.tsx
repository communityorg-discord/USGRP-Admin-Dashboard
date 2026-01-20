'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Backup {
    name: string;
    createdAt: string;
    size: string;
    type: string;
}

export default function BackupsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [backups] = useState<Backup[]>([
        // Mock data - in production this would come from the API
        { name: 'backup-2026-01-20-full.zip', createdAt: '2026-01-20T04:00:00Z', size: '245 MB', type: 'Full' },
        { name: 'backup-2026-01-19-full.zip', createdAt: '2026-01-19T04:00:00Z', size: '243 MB', type: 'Full' },
        { name: 'backup-2026-01-18-full.zip', createdAt: '2026-01-18T04:00:00Z', size: '241 MB', type: 'Full' },
        { name: 'backup-2026-01-17-channels.zip', createdAt: '2026-01-17T12:00:00Z', size: '45 MB', type: 'Channels' },
        { name: 'backup-2026-01-15-full.zip', createdAt: '2026-01-15T04:00:00Z', size: '238 MB', type: 'Full' },
    ]);

    useEffect(() => {
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                if (!data.authenticated) {
                    router.push('/');
                }
                setLoading(false);
            });
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="text-cyan-400 animate-pulse text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors">
                            ← Back
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Server Backups</h1>
                            <p className="text-gray-500">{backups.length} backups available</p>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="glass-card p-4 mb-6 flex items-center gap-4 bg-cyan-500/5 border-cyan-500/20">
                    <span className="text-2xl">💡</span>
                    <p className="text-gray-400 text-sm">
                        Backups are created daily at 4:00 AM UTC. Use <code className="text-cyan-400">/backup create</code> in Discord to create a manual backup.
                    </p>
                </div>

                {/* Backups List */}
                <div className="space-y-3">
                    {backups.map((backup, i) => (
                        <div key={i} className="glass-card p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-3xl">💾</span>
                                <div>
                                    <h3 className="font-medium">{backup.name}</h3>
                                    <div className="text-sm text-gray-500 flex gap-4 mt-1">
                                        <span>{new Date(backup.createdAt).toLocaleString()}</span>
                                        <span>{backup.size}</span>
                                        <span className={`px-2 py-0.5 rounded text-xs ${backup.type === 'Full' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                                            }`}>{backup.type}</span>
                                    </div>
                                </div>
                            </div>
                            <button className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                Download
                            </button>
                        </div>
                    ))}
                </div>

                {/* Note */}
                <div className="mt-8 text-center text-gray-600 text-sm">
                    <p>Backups include: roles, channels, permissions, and bot configurations.</p>
                    <p className="mt-1">Messages are not included in backups.</p>
                </div>
            </div>
        </div>
    );
}
