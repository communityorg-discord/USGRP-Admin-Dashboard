'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AppealPage() {
    const [formData, setFormData] = useState({
        discordId: '',
        email: '',
        reason: '',
        explanation: '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        await new Promise(r => setTimeout(r, 1500));
        setSubmitted(true);
        setLoading(false);
    };

    if (submitted) {
        return (
            <div className="appeal-container">
                <div className="appeal-card">
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Appeal Submitted</h1>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                            Your appeal has been received and will be reviewed by our staff team.
                        </p>
                        <Link href="/" className="appeal-btn">Back to Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="appeal-container">
            <div className="appeal-card">
                <div className="appeal-header">
                    <div className="appeal-logo">⚖️</div>
                    <h1>Ban/Mute Appeal</h1>
                    <p>Submit an appeal for review by USGRP staff</p>
                </div>

                <form onSubmit={handleSubmit} className="appeal-form">
                    <div className="form-group">
                        <label>Discord User ID *</label>
                        <input
                            type="text"
                            value={formData.discordId}
                            onChange={(e) => setFormData({ ...formData, discordId: e.target.value })}
                            placeholder="e.g. 123456789012345678"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email Address *</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Reason for Ban/Mute</label>
                        <input
                            type="text"
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="If you know the reason"
                        />
                    </div>

                    <div className="form-group">
                        <label>Why should we unban/unmute you? *</label>
                        <textarea
                            value={formData.explanation}
                            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                            placeholder="Explain your situation..."
                            rows={5}
                            required
                        />
                    </div>

                    <button type="submit" className="appeal-btn" disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Appeal'}
                    </button>
                </form>

                <div className="appeal-footer">
                    <Link href="/">Staff Login</Link>
                </div>
            </div>
        </div>
    );
}
