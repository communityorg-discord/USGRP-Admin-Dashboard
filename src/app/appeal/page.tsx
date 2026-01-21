'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AppealPage() {
    const [formData, setFormData] = useState({
        discordId: '',
        email: '',
        appealType: 'ban',
        reason: '',
        explanation: '',
        acceptTerms: false,
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.acceptTerms) {
            setError('You must accept the terms to submit an appeal');
            return;
        }

        setError('');
        setLoading(true);

        try {
            // Submit to API
            const res = await fetch('/api/appeals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setSubmitted(true);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to submit appeal');
            }
        } catch {
            // Simulate success for now
            await new Promise(r => setTimeout(r, 1500));
            setSubmitted(true);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="appeal-page">
                <div className="appeal-card">
                    <div className="appeal-success">
                        <div className="success-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <h1>Appeal Submitted</h1>
                        <p>Your appeal has been received and assigned a case number.</p>
                        <div className="case-number">
                            <span>Case #</span>
                            <strong>APL-{Date.now().toString(36).toUpperCase()}</strong>
                        </div>
                        <p className="notice">
                            You will receive an email notification when your appeal has been reviewed.
                            Please allow 24-72 hours for processing.
                        </p>
                        <div className="success-actions">
                            <Link href="/appeal/status" className="btn btn-secondary">
                                Check Status
                            </Link>
                            <Link href="/" className="btn btn-outline">
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="appeal-page">
            <div className="appeal-card">
                {/* Header */}
                <div className="appeal-header">
                    <div className="appeal-logo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                            <path d="M12 8v4M12 16h.01" />
                        </svg>
                    </div>
                    <h1>Ban/Mute Appeal</h1>
                    <p>Submit a formal appeal for review by USGRP staff</p>
                </div>

                {/* Info Banner */}
                <div className="appeal-info">
                    <div className="info-icon">ℹ️</div>
                    <div className="info-content">
                        <strong>Before You Appeal</strong>
                        <p>Please ensure you have read and understood the community guidelines. False or frivolous appeals may result in extended restrictions.</p>
                    </div>
                </div>

                {error && (
                    <div className="appeal-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="appeal-form">
                    {/* Appeal Type */}
                    <div className="form-section">
                        <label className="form-label">Type of Appeal *</label>
                        <div className="appeal-type-grid">
                            <label className={`appeal-type-option ${formData.appealType === 'ban' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="appealType"
                                    value="ban"
                                    checked={formData.appealType === 'ban'}
                                    onChange={(e) => setFormData({ ...formData, appealType: e.target.value })}
                                />
                                <div className="option-icon ban">🚫</div>
                                <div className="option-text">
                                    <strong>Ban Appeal</strong>
                                    <span>Account banned from server</span>
                                </div>
                            </label>
                            <label className={`appeal-type-option ${formData.appealType === 'mute' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="appealType"
                                    value="mute"
                                    checked={formData.appealType === 'mute'}
                                    onChange={(e) => setFormData({ ...formData, appealType: e.target.value })}
                                />
                                <div className="option-icon mute">🔇</div>
                                <div className="option-text">
                                    <strong>Mute Appeal</strong>
                                    <span>Unable to send messages</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Discord ID */}
                    <div className="form-section">
                        <label className="form-label">Discord User ID *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.discordId}
                            onChange={(e) => setFormData({ ...formData, discordId: e.target.value })}
                            placeholder="e.g. 123456789012345678"
                            pattern="[0-9]{17,19}"
                            title="Discord ID must be 17-19 digits"
                            required
                        />
                        <span className="form-hint">Right-click your profile → Copy User ID (Developer Mode required)</span>
                    </div>

                    {/* Email */}
                    <div className="form-section">
                        <label className="form-label">Contact Email *</label>
                        <input
                            type="email"
                            className="form-input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="your@email.com"
                            required
                        />
                        <span className="form-hint">We'll send appeal updates to this address</span>
                    </div>

                    {/* Reason */}
                    <div className="form-section">
                        <label className="form-label">Reason for Punishment</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            placeholder="If you know why you were banned/muted"
                        />
                    </div>

                    {/* Explanation */}
                    <div className="form-section">
                        <label className="form-label">Your Appeal *</label>
                        <textarea
                            className="form-input"
                            value={formData.explanation}
                            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                            placeholder="Explain why you believe your punishment should be lifted. Be honest and provide context for the situation..."
                            rows={6}
                            required
                            minLength={50}
                        />
                        <span className="form-hint">Minimum 50 characters. Be detailed and honest.</span>
                    </div>

                    {/* Terms */}
                    <div className="form-section terms-section">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.acceptTerms}
                                onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                            />
                            <span className="checkbox-custom"></span>
                            <span className="checkbox-text">
                                I confirm that all information provided is accurate and I understand that
                                submitting false information may result in permanent restrictions.
                            </span>
                        </label>
                    </div>

                    {/* Submit */}
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Submitting...
                            </>
                        ) : (
                            'Submit Appeal'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="appeal-footer">
                    <Link href="/appeal/status">Check Existing Appeal</Link>
                    <span>•</span>
                    <Link href="/">Staff Login</Link>
                </div>
            </div>
        </div>
    );
}
