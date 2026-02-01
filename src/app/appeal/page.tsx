'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AppealPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        discordId: '',
        discordUsername: '',
        email: '',
        appealType: 'ban',
        banReason: '',
        appealMessage: '',
        evidence: '',
        acceptTerms: false,
    });
    const [submitted, setSubmitted] = useState(false);
    const [appealId, setAppealId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.acceptTerms) {
            setError('You must accept the terms to submit an appeal');
            return;
        }

        if (formData.appealMessage.length < 50) {
            setError('Your appeal message must be at least 50 characters');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/appeals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setAppealId(data.appealId);
                setSubmitted(true);
            } else {
                setError(data.error || 'Failed to submit appeal');
            }
        } catch {
            setError('Failed to connect to server. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 1) {
            if (!formData.discordId || !/^\d{17,19}$/.test(formData.discordId)) {
                setError('Please enter a valid Discord User ID (17-19 digits)');
                return;
            }
            if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                setError('Please enter a valid email address');
                return;
            }
        }
        setError('');
        setStep(step + 1);
    };

    if (submitted) {
        return (
            <div className="appeal-page">
                <div className="appeal-container">
                    <div className="success-card">
                        <div className="success-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9 12l2 2 4-4" />
                            </svg>
                        </div>
                        <h1>Appeal Submitted</h1>
                        <p>Your appeal has been received and is now pending review.</p>
                        
                        <div className="case-id-box">
                            <span className="label">Your Case ID</span>
                            <span className="case-id">{appealId}</span>
                            <button className="copy-btn" onClick={() => navigator.clipboard.writeText(appealId)}>
                                Copy
                            </button>
                        </div>

                        <div className="next-steps">
                            <h3>What happens next?</h3>
                            <ul>
                                <li>A staff member will review your appeal within 24-72 hours</li>
                                <li>You'll receive an email notification when a decision is made</li>
                                <li>Staff may reach out if they need additional information</li>
                            </ul>
                        </div>

                        <div className="success-actions">
                            <Link href={`/appeal/status/${appealId}`} className="btn btn-primary">
                                Track Your Appeal
                            </Link>
                            <a href="https://discord.gg/usgrp" className="btn btn-secondary" target="_blank">
                                Join Discord
                            </a>
                        </div>
                    </div>
                </div>
                <style jsx>{styles}</style>
            </div>
        );
    }

    return (
        <div className="appeal-page">
            <div className="appeal-container">
                {/* Header */}
                <div className="appeal-header">
                    <div className="logo">
                        <svg viewBox="0 0 40 40" fill="none">
                            <rect width="40" height="40" rx="10" fill="url(#grad)" />
                            <path d="M12 12v16h4v-6h6c2.2 0 4-1.8 4-4v-6H12zm4 6v-2h8v2c0 .6-.4 1-1 1h-7z" fill="white" fillOpacity="0.9"/>
                            <defs>
                                <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40">
                                    <stop stopColor="#3b82f6" />
                                    <stop offset="1" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <span>USGRP</span>
                    </div>
                    <h1>Appeal Center</h1>
                    <p>Submit an appeal for review by our moderation team</p>
                </div>

                {/* Progress Steps */}
                <div className="progress-steps">
                    <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                        <span className="step-number">1</span>
                        <span className="step-label">Your Info</span>
                    </div>
                    <div className="step-line" />
                    <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                        <span className="step-number">2</span>
                        <span className="step-label">Appeal Details</span>
                    </div>
                    <div className="step-line" />
                    <div className={`step ${step >= 3 ? 'active' : ''}`}>
                        <span className="step-number">3</span>
                        <span className="step-label">Review & Submit</span>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="alert error">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="appeal-form">
                    {/* Step 1: User Info */}
                    {step === 1 && (
                        <div className="form-step">
                            <h2>Tell us who you are</h2>
                            <p className="step-desc">We need this to identify your account and contact you about your appeal.</p>

                            <div className="form-group">
                                <label>Discord User ID <span className="required">*</span></label>
                                <input
                                    type="text"
                                    value={formData.discordId}
                                    onChange={(e) => setFormData({ ...formData, discordId: e.target.value.replace(/\D/g, '') })}
                                    placeholder="e.g. 123456789012345678"
                                    maxLength={19}
                                />
                                <span className="hint">
                                    <a href="https://support.discord.com/hc/en-us/articles/206346498" target="_blank">How to find your Discord ID</a>
                                </span>
                            </div>

                            <div className="form-group">
                                <label>Discord Username</label>
                                <input
                                    type="text"
                                    value={formData.discordUsername}
                                    onChange={(e) => setFormData({ ...formData, discordUsername: e.target.value })}
                                    placeholder="e.g. username#1234 or @username"
                                />
                            </div>

                            <div className="form-group">
                                <label>Email Address <span className="required">*</span></label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="your@email.com"
                                />
                                <span className="hint">We'll send updates about your appeal to this email</span>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-primary" onClick={nextStep}>
                                    Continue
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Appeal Details */}
                    {step === 2 && (
                        <div className="form-step">
                            <h2>Appeal Details</h2>
                            <p className="step-desc">Tell us about your situation and why you're appealing.</p>

                            <div className="form-group">
                                <label>What are you appealing? <span className="required">*</span></label>
                                <div className="appeal-type-selector">
                                    <label className={`type-option ${formData.appealType === 'ban' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="appealType"
                                            value="ban"
                                            checked={formData.appealType === 'ban'}
                                            onChange={(e) => setFormData({ ...formData, appealType: e.target.value })}
                                        />
                                        <div className="option-icon ban">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                            </svg>
                                        </div>
                                        <div className="option-text">
                                            <strong>Ban Appeal</strong>
                                            <span>I was banned from the server</span>
                                        </div>
                                    </label>
                                    <label className={`type-option ${formData.appealType === 'mute' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="appealType"
                                            value="mute"
                                            checked={formData.appealType === 'mute'}
                                            onChange={(e) => setFormData({ ...formData, appealType: e.target.value })}
                                        />
                                        <div className="option-icon mute">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 5L6 9H2v6h4l5 4V5zM22 9l-6 6M16 9l6 6" />
                                            </svg>
                                        </div>
                                        <div className="option-text">
                                            <strong>Mute/Timeout Appeal</strong>
                                            <span>I was muted or timed out</span>
                                        </div>
                                    </label>
                                    <label className={`type-option ${formData.appealType === 'warn' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="appealType"
                                            value="warn"
                                            checked={formData.appealType === 'warn'}
                                            onChange={(e) => setFormData({ ...formData, appealType: e.target.value })}
                                        />
                                        <div className="option-icon warn">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                                <line x1="12" y1="9" x2="12" y2="13" />
                                                <line x1="12" y1="17" x2="12.01" y2="17" />
                                            </svg>
                                        </div>
                                        <div className="option-text">
                                            <strong>Warning Dispute</strong>
                                            <span>I want to dispute a warning</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Reason given for punishment (if known)</label>
                                <input
                                    type="text"
                                    value={formData.banReason}
                                    onChange={(e) => setFormData({ ...formData, banReason: e.target.value })}
                                    placeholder="What reason were you given, if any?"
                                />
                            </div>

                            <div className="form-group">
                                <label>Your Appeal <span className="required">*</span></label>
                                <textarea
                                    value={formData.appealMessage}
                                    onChange={(e) => setFormData({ ...formData, appealMessage: e.target.value })}
                                    placeholder="Explain why you believe your punishment should be lifted or reduced. Be honest and provide context..."
                                    rows={6}
                                />
                                <span className="hint">{formData.appealMessage.length}/50 characters minimum</span>
                            </div>

                            <div className="form-group">
                                <label>Supporting Evidence (optional)</label>
                                <textarea
                                    value={formData.evidence}
                                    onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                                    placeholder="Links to screenshots, context, witnesses, etc."
                                    rows={3}
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 12H5M12 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>
                                <button type="button" className="btn btn-primary" onClick={nextStep}>
                                    Continue
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review & Submit */}
                    {step === 3 && (
                        <div className="form-step">
                            <h2>Review Your Appeal</h2>
                            <p className="step-desc">Please review your information before submitting.</p>

                            <div className="review-section">
                                <div className="review-group">
                                    <label>Discord ID</label>
                                    <span>{formData.discordId}</span>
                                </div>
                                <div className="review-group">
                                    <label>Username</label>
                                    <span>{formData.discordUsername || 'Not provided'}</span>
                                </div>
                                <div className="review-group">
                                    <label>Email</label>
                                    <span>{formData.email}</span>
                                </div>
                                <div className="review-group">
                                    <label>Appeal Type</label>
                                    <span className={`badge ${formData.appealType}`}>
                                        {formData.appealType === 'ban' ? 'Ban Appeal' : formData.appealType === 'mute' ? 'Mute Appeal' : 'Warning Dispute'}
                                    </span>
                                </div>
                                {formData.banReason && (
                                    <div className="review-group">
                                        <label>Punishment Reason</label>
                                        <span>{formData.banReason}</span>
                                    </div>
                                )}
                                <div className="review-group full">
                                    <label>Your Appeal</label>
                                    <p className="appeal-text">{formData.appealMessage}</p>
                                </div>
                                {formData.evidence && (
                                    <div className="review-group full">
                                        <label>Evidence</label>
                                        <p className="appeal-text">{formData.evidence}</p>
                                    </div>
                                )}
                            </div>

                            <div className="terms-section">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.acceptTerms}
                                        onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                                    />
                                    <span className="checkbox-custom" />
                                    <span className="checkbox-text">
                                        I confirm that all information provided is accurate. I understand that submitting false information may result in my appeal being denied and/or additional restrictions on my account.
                                    </span>
                                </label>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M19 12H5M12 19l-7-7 7-7" />
                                    </svg>
                                    Back
                                </button>
                                <button type="submit" className="btn btn-primary btn-submit" disabled={loading || !formData.acceptTerms}>
                                    {loading ? (
                                        <>
                                            <span className="spinner" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            Submit Appeal
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="appeal-footer">
                    <Link href="/appeal/status">Check Existing Appeal</Link>
                    <span>•</span>
                    <a href="https://discord.gg/usgrp" target="_blank">Discord Server</a>
                    <span>•</span>
                    <Link href="/">Staff Login</Link>
                </div>
            </div>

            <style jsx>{styles}</style>
        </div>
    );
}

const styles = `
    .appeal-page {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding: 40px 20px;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
    }

    .appeal-container {
        width: 100%;
        max-width: 680px;
    }

    .appeal-header {
        text-align: center;
        margin-bottom: 32px;
    }

    .logo {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
    }

    .logo svg {
        width: 40px;
        height: 40px;
    }

    .logo span {
        font-size: 20px;
        font-weight: 800;
        color: #fff;
        letter-spacing: -0.02em;
    }

    .appeal-header h1 {
        font-size: 32px;
        font-weight: 700;
        color: #fff;
        margin: 0 0 8px 0;
    }

    .appeal-header p {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.6);
        margin: 0;
    }

    .progress-steps {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0;
        margin-bottom: 32px;
    }

    .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }

    .step-number {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.4);
        transition: all 0.3s;
    }

    .step.active .step-number {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
        border-color: transparent;
        color: #fff;
    }

    .step.completed .step-number {
        background: #10b981;
        border-color: transparent;
        color: #fff;
    }

    .step-label {
        font-size: 12px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.4);
    }

    .step.active .step-label {
        color: #fff;
    }

    .step-line {
        width: 60px;
        height: 2px;
        background: rgba(255, 255, 255, 0.1);
        margin: 0 12px;
        margin-bottom: 28px;
    }

    .alert {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 18px;
        border-radius: 12px;
        margin-bottom: 24px;
    }

    .alert.error {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .alert svg {
        width: 20px;
        height: 20px;
        color: #ef4444;
        flex-shrink: 0;
    }

    .alert span {
        font-size: 14px;
        color: #fca5a5;
    }

    .appeal-form {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 32px;
    }

    .form-step h2 {
        font-size: 22px;
        font-weight: 600;
        color: #fff;
        margin: 0 0 8px 0;
    }

    .step-desc {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.5);
        margin: 0 0 28px 0;
    }

    .form-group {
        margin-bottom: 24px;
    }

    .form-group label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 8px;
    }

    .required {
        color: #ef4444;
    }

    .form-group input,
    .form-group textarea {
        width: 100%;
        padding: 14px 16px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: #fff;
        font-size: 15px;
        transition: all 0.2s;
    }

    .form-group input:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: #3b82f6;
        background: rgba(59, 130, 246, 0.05);
    }

    .form-group input::placeholder,
    .form-group textarea::placeholder {
        color: rgba(255, 255, 255, 0.3);
    }

    .hint {
        display: block;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.4);
        margin-top: 6px;
    }

    .hint a {
        color: #60a5fa;
        text-decoration: none;
    }

    .hint a:hover {
        text-decoration: underline;
    }

    .appeal-type-selector {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .type-option {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .type-option:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.15);
    }

    .type-option.selected {
        background: rgba(59, 130, 246, 0.1);
        border-color: rgba(59, 130, 246, 0.4);
    }

    .type-option input {
        display: none;
    }

    .option-icon {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .option-icon svg {
        width: 22px;
        height: 22px;
    }

    .option-icon.ban {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
    }

    .option-icon.mute {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
    }

    .option-icon.warn {
        background: rgba(139, 92, 246, 0.15);
        color: #8b5cf6;
    }

    .option-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .option-text strong {
        font-size: 15px;
        font-weight: 600;
        color: #fff;
    }

    .option-text span {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.5);
    }

    .form-actions {
        display: flex;
        gap: 12px;
        margin-top: 32px;
    }

    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 14px 24px;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        text-decoration: none;
    }

    .btn svg {
        width: 18px;
        height: 18px;
    }

    .btn-primary {
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: #fff;
        flex: 1;
    }

    .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
    }

    .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn-secondary {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.8);
    }

    .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.1);
    }

    .review-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 24px;
    }

    .review-group {
        background: rgba(255, 255, 255, 0.03);
        padding: 16px;
        border-radius: 10px;
    }

    .review-group.full {
        grid-column: span 2;
    }

    .review-group label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.4);
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .review-group span,
    .review-group p {
        font-size: 14px;
        color: #fff;
        margin: 0;
    }

    .review-group .badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
    }

    .badge.ban {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
    }

    .badge.mute {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
    }

    .badge.warn {
        background: rgba(139, 92, 246, 0.15);
        color: #8b5cf6;
    }

    .appeal-text {
        white-space: pre-wrap;
        line-height: 1.6;
    }

    .terms-section {
        margin-top: 24px;
        padding-top: 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .checkbox-label {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        cursor: pointer;
    }

    .checkbox-label input {
        display: none;
    }

    .checkbox-custom {
        width: 22px;
        height: 22px;
        border-radius: 6px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        background: transparent;
        flex-shrink: 0;
        transition: all 0.2s;
        position: relative;
    }

    .checkbox-label input:checked + .checkbox-custom {
        background: #3b82f6;
        border-color: #3b82f6;
    }

    .checkbox-label input:checked + .checkbox-custom::after {
        content: '';
        position: absolute;
        top: 4px;
        left: 7px;
        width: 5px;
        height: 10px;
        border: solid #fff;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
    }

    .checkbox-text {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.5;
    }

    .spinner {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .appeal-footer {
        text-align: center;
        margin-top: 32px;
        display: flex;
        justify-content: center;
        gap: 16px;
    }

    .appeal-footer a {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.5);
        text-decoration: none;
    }

    .appeal-footer a:hover {
        color: #60a5fa;
    }

    .appeal-footer span {
        color: rgba(255, 255, 255, 0.2);
    }

    /* Success State */
    .success-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 48px 32px;
        text-align: center;
    }

    .success-icon {
        width: 72px;
        height: 72px;
        background: rgba(16, 185, 129, 0.15);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 24px;
    }

    .success-icon svg {
        width: 36px;
        height: 36px;
        color: #10b981;
    }

    .success-card h1 {
        font-size: 28px;
        font-weight: 700;
        color: #fff;
        margin: 0 0 12px 0;
    }

    .success-card > p {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.6);
        margin: 0 0 32px 0;
    }

    .case-id-box {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        background: rgba(59, 130, 246, 0.1);
        border: 1px solid rgba(59, 130, 246, 0.25);
        border-radius: 12px;
        padding: 16px 24px;
        margin-bottom: 32px;
    }

    .case-id-box .label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .case-id-box .case-id {
        font-size: 20px;
        font-weight: 700;
        color: #60a5fa;
        font-family: monospace;
    }

    .copy-btn {
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        border-radius: 6px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .copy-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
    }

    .next-steps {
        text-align: left;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 12px;
        padding: 20px 24px;
        margin-bottom: 32px;
    }

    .next-steps h3 {
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        margin: 0 0 12px 0;
    }

    .next-steps ul {
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .next-steps li {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.6);
        padding: 8px 0;
        padding-left: 24px;
        position: relative;
    }

    .next-steps li::before {
        content: '→';
        position: absolute;
        left: 0;
        color: #10b981;
    }

    .success-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
    }

    @media (max-width: 640px) {
        .appeal-form {
            padding: 24px 20px;
        }

        .review-section {
            grid-template-columns: 1fr;
        }

        .review-group.full {
            grid-column: span 1;
        }

        .form-actions {
            flex-direction: column;
        }

        .success-actions {
            flex-direction: column;
        }

        .case-id-box {
            flex-direction: column;
            gap: 8px;
        }
    }
`;
