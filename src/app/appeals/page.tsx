'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Appeal {
    id: string;
    discordId: string;
    discordUsername: string;
    email: string;
    banReason: string;
    appealMessage: string;
    evidence: string;
    status: 'pending' | 'approved' | 'denied';
    createdAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    reviewNote?: string;
}

export default function AppealsManagementPage() {
    const router = useRouter();
    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');
    const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
    const [reviewNote, setReviewNote] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        // Check auth and load appeals
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                if (!data.authenticated) {
                    router.push('/');
                } else {
                    loadAppeals();
                }
            });
    }, [router]);

    const loadAppeals = async () => {
        const res = await fetch('/api/appeals');
        const data = await res.json();
        setAppeals(data);
        setLoading(false);
    };

    const handleReview = async (status: 'approved' | 'denied') => {
        if (!selectedAppeal) return;
        setUpdating(true);

        const res = await fetch(`/api/appeals/${selectedAppeal.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, reviewNote }),
        });

        if (res.ok) {
            await loadAppeals();
            setSelectedAppeal(null);
            setReviewNote('');
        }
        setUpdating(false);
    };

    const filtered = appeals.filter(a => filter === 'all' || a.status === filter);

    const statusColors = {
        pending: 'text-yellow-400 bg-yellow-500/10',
        approved: 'text-green-400 bg-green-500/10',
        denied: 'text-red-400 bg-red-500/10',
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="text-cyan-400 animate-pulse text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors">
                            ← Back
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Ban Appeals</h1>
                            <p className="text-gray-500">
                                {appeals.filter(a => a.status === 'pending').length} pending review
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6">
                    {(['all', 'pending', 'approved', 'denied'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg transition-colors capitalize ${filter === f ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            {f} {f !== 'all' && `(${appeals.filter(a => a.status === f).length})`}
                        </button>
                    ))}
                </div>

                {/* Appeals List */}
                <div className="space-y-4">
                    {filtered.length === 0 ? (
                        <div className="glass-card p-12 text-center text-gray-500">
                            No {filter !== 'all' ? filter : ''} appeals found
                        </div>
                    ) : filtered.map(appeal => (
                        <div
                            key={appeal.id}
                            className="glass-card p-6 cursor-pointer hover:border-cyan-500/30 transition-colors"
                            onClick={() => setSelectedAppeal(appeal)}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-mono text-cyan-400">{appeal.id}</span>
                                        <span className={`px-2 py-1 rounded text-xs ${statusColors[appeal.status]}`}>
                                            {appeal.status}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-lg">{appeal.discordUsername}</h3>
                                    <p className="text-gray-500 text-sm">{appeal.discordId}</p>
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                    <div>{new Date(appeal.createdAt).toLocaleDateString()}</div>
                                    <div>{new Date(appeal.createdAt).toLocaleTimeString()}</div>
                                </div>
                            </div>
                            <p className="mt-4 text-gray-400 line-clamp-2">{appeal.appealMessage}</p>
                        </div>
                    ))}
                </div>

                {/* Review Modal */}
                {selectedAppeal && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                        <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="font-mono text-cyan-400">{selectedAppeal.id}</span>
                                    <h2 className="text-2xl font-bold mt-1">{selectedAppeal.discordUsername}</h2>
                                </div>
                                <button
                                    onClick={() => setSelectedAppeal(null)}
                                    className="text-gray-500 hover:text-white text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Discord ID:</span>
                                    <span className="ml-2 font-mono">{selectedAppeal.discordId}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Email:</span>
                                    <span className="ml-2">{selectedAppeal.email}</span>
                                </div>
                                {selectedAppeal.banReason && (
                                    <div>
                                        <span className="text-gray-500">Ban Reason:</span>
                                        <span className="ml-2">{selectedAppeal.banReason}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6">
                                <h3 className="text-gray-400 mb-2">Appeal Message:</h3>
                                <div className="bg-white/5 p-4 rounded-lg whitespace-pre-wrap">
                                    {selectedAppeal.appealMessage}
                                </div>
                            </div>

                            {selectedAppeal.evidence && (
                                <div className="mt-4">
                                    <h3 className="text-gray-400 mb-2">Evidence:</h3>
                                    <div className="bg-white/5 p-4 rounded-lg whitespace-pre-wrap">
                                        {selectedAppeal.evidence}
                                    </div>
                                </div>
                            )}

                            {selectedAppeal.status === 'pending' ? (
                                <div className="mt-6 pt-6 border-t border-white/10">
                                    <textarea
                                        value={reviewNote}
                                        onChange={(e) => setReviewNote(e.target.value)}
                                        placeholder="Add a response note (optional)..."
                                        className="input-field mb-4 min-h-[100px]"
                                    />
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleReview('approved')}
                                            disabled={updating}
                                            className="flex-1 py-3 rounded-lg font-semibold bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                                        >
                                            ✓ Approve
                                        </button>
                                        <button
                                            onClick={() => handleReview('denied')}
                                            disabled={updating}
                                            className="flex-1 py-3 rounded-lg font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                        >
                                            ✕ Deny
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-6 pt-6 border-t border-white/10">
                                    <div className={`text-center p-4 rounded-lg ${statusColors[selectedAppeal.status]}`}>
                                        {selectedAppeal.status === 'approved' ? '✅ Approved' : '❌ Denied'}
                                        {selectedAppeal.reviewedBy && (
                                            <span className="ml-2 text-gray-500">by {selectedAppeal.reviewedBy}</span>
                                        )}
                                    </div>
                                    {selectedAppeal.reviewNote && (
                                        <div className="mt-4 p-4 bg-white/5 rounded-lg">
                                            <p className="text-gray-400 text-sm">Response:</p>
                                            <p>{selectedAppeal.reviewNote}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
