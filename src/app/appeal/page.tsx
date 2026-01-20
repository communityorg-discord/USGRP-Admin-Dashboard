'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AppealPage() {
    const [formData, setFormData] = useState({
        discordId: '',
        discordUsername: '',
        email: '',
        banReason: '',
        appealMessage: '',
        evidence: '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [appealId, setAppealId] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/appeals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                setAppealId(data.appealId);
                setSubmitted(true);
            } else {
                setError(data.error || 'Failed to submit appeal');
            }
        } catch {
            setError('Connection failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{
                background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)'
            }}>
                <div className="max-w-md text-center animate-fadeIn">
                    <div className="text-6xl mb-6">✅</div>
                    <h1 className="text-3xl font-bold mb-4">Appeal Submitted</h1>
                    <p className="text-gray-400 mb-6">
                        Your appeal has been received and will be reviewed by our staff team.
                    </p>
                    <div className="glass-card p-4 mb-6">
                        <p className="text-gray-500 text-sm mb-2">Your Appeal ID</p>
                        <p className="text-2xl font-mono text-cyan-400">{appealId}</p>
                    </div>
                    <p className="text-gray-500 text-sm mb-6">
                        You will receive an email at <span className="text-white">{formData.email}</span> when your appeal is reviewed.
                    </p>
                    <Link href={`/appeal/status/${appealId}`} className="btn-primary inline-block">
                        Check Appeal Status
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 py-12" style={{
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)'
        }}>
            <div className="max-w-2xl mx-auto animate-fadeIn">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-4">⚖️</div>
                    <h1 className="text-3xl font-bold gradient-text mb-2">Ban Appeal</h1>
                    <p className="text-gray-500">Submit an appeal if you believe your ban was unjust</p>
                </div>

                {/* Form */}
                <div className="glass-card p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Discord Username *</label>
                                <input
                                    type="text"
                                    value={formData.discordUsername}
                                    onChange={(e) => setFormData({ ...formData, discordUsername: e.target.value })}
                                    placeholder="username"
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">Discord User ID *</label>
                                <input
                                    type="text"
                                    value={formData.discordId}
                                    onChange={(e) => setFormData({ ...formData, discordId: e.target.value })}
                                    placeholder="123456789012345678"
                                    className="input-field"
                                    required
                                />
                                <p className="text-xs text-gray-600 mt-1">Right-click your profile → Copy User ID</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Email Address *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="your@email.com"
                                className="input-field"
                                required
                            />
                            <p className="text-xs text-gray-600 mt-1">We&apos;ll notify you when your appeal is reviewed</p>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Ban Reason (if known)</label>
                            <input
                                type="text"
                                value={formData.banReason}
                                onChange={(e) => setFormData({ ...formData, banReason: e.target.value })}
                                placeholder="What reason was given for your ban?"
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Why should your ban be appealed? *</label>
                            <textarea
                                value={formData.appealMessage}
                                onChange={(e) => setFormData({ ...formData, appealMessage: e.target.value })}
                                placeholder="Explain your situation honestly. Include any context that may help us understand what happened."
                                className="input-field min-h-[150px] resize-y"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Additional Evidence</label>
                            <textarea
                                value={formData.evidence}
                                onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                                placeholder="Links to screenshots, messages, or any other evidence that supports your appeal."
                                className="input-field min-h-[80px] resize-y"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full text-lg py-4"
                            >
                                {loading ? 'Submitting...' : 'Submit Appeal'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Info Box */}
                <div className="mt-6 glass-card p-6">
                    <h3 className="font-semibold mb-3 text-yellow-400">⚠️ Important Notes</h3>
                    <ul className="text-gray-400 text-sm space-y-2">
                        <li>• Be honest in your appeal. Lying will result in automatic denial.</li>
                        <li>• Appeals are typically reviewed within 48-72 hours.</li>
                        <li>• You may only submit one appeal per ban.</li>
                        <li>• Staff decisions are final.</li>
                    </ul>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-gray-600 text-sm">
                    Already have an appeal? <Link href="/appeal/status" className="text-cyan-400 hover:underline">Check Status</Link>
                </div>
            </div>
        </div>
    );
}
