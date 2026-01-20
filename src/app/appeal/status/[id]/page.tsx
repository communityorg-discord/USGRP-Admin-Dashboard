'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Appeal {
    id: string;
    discordUsername: string;
    status: 'pending' | 'approved' | 'denied';
    createdAt: string;
    reviewedAt?: string;
    reviewNote?: string;
}

export default function AppealStatusPage() {
    const params = useParams();
    const appealId = params.id as string;
    const [appeal, setAppeal] = useState<Appeal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (appealId) {
            fetch(`/api/appeals/${appealId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        setError(data.error);
                    } else {
                        setAppeal(data);
                    }
                    setLoading(false);
                })
                .catch(() => {
                    setError('Failed to load appeal');
                    setLoading(false);
                });
        }
    }, [appealId]);

    const statusConfig = {
        pending: { icon: '⏳', color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Pending Review' },
        approved: { icon: '✅', color: 'text-green-400', bg: 'bg-green-500/10', label: 'Approved' },
        denied: { icon: '❌', color: 'text-red-400', bg: 'bg-red-500/10', label: 'Denied' },
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)'
        }}>
            <div className="max-w-md w-full animate-fadeIn">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">📋</div>
                    <h1 className="text-3xl font-bold mb-2">Appeal Status</h1>
                    <p className="text-gray-500 font-mono">{appealId}</p>
                </div>

                {loading ? (
                    <div className="glass-card p-8 text-center">
                        <div className="text-cyan-400 animate-pulse text-xl">Loading...</div>
                    </div>
                ) : error ? (
                    <div className="glass-card p-8 text-center">
                        <div className="text-5xl mb-4">❓</div>
                        <p className="text-red-400 mb-4">{error}</p>
                        <Link href="/appeal" className="btn-primary inline-block">Submit New Appeal</Link>
                    </div>
                ) : appeal && (
                    <div className="glass-card p-8">
                        <div className={`text-center p-6 rounded-xl ${statusConfig[appeal.status].bg} mb-6`}>
                            <div className="text-5xl mb-2">{statusConfig[appeal.status].icon}</div>
                            <div className={`text-2xl font-bold ${statusConfig[appeal.status].color}`}>
                                {statusConfig[appeal.status].label}
                            </div>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between py-2 border-b border-white/10">
                                <span className="text-gray-500">Discord User</span>
                                <span>{appeal.discordUsername}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-white/10">
                                <span className="text-gray-500">Submitted</span>
                                <span>{new Date(appeal.createdAt).toLocaleDateString()}</span>
                            </div>
                            {appeal.reviewedAt && (
                                <div className="flex justify-between py-2 border-b border-white/10">
                                    <span className="text-gray-500">Reviewed</span>
                                    <span>{new Date(appeal.reviewedAt).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>

                        {appeal.reviewNote && (
                            <div className="mt-6 p-4 bg-white/5 rounded-lg">
                                <p className="text-gray-400 text-sm mb-2">Staff Response:</p>
                                <p className="text-white">{appeal.reviewNote}</p>
                            </div>
                        )}

                        {appeal.status === 'approved' && (
                            <div className="mt-6 text-center">
                                <p className="text-green-400 text-sm">
                                    Your ban has been lifted. You may rejoin the server.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-6 text-center">
                    <Link href="/appeal" className="text-gray-500 hover:text-cyan-400 transition-colors">
                        ← Submit Another Appeal
                    </Link>
                </div>
            </div>
        </div>
    );
}
