'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AppealStatusPage() {
    const [caseId, setCaseId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [appeal, setAppeal] = useState<any>(null);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!caseId.trim()) {
            setError('Please enter your Case ID');
            return;
        }

        setError('');
        setLoading(true);
        setAppeal(null);

        try {
            const res = await fetch(`/api/appeals/${caseId.trim().toUpperCase()}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Appeal not found');
            } else {
                setAppeal(data);
            }
        } catch {
            setError('Failed to check appeal status');
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'pending':
                return { label: 'Pending Review', color: '#f59e0b', icon: '⏳', desc: 'Your appeal is waiting to be reviewed by our moderation team.' };
            case 'under_review':
                return { label: 'Under Review', color: '#3b82f6', icon: '🔍', desc: 'A staff member is currently reviewing your appeal.' };
            case 'approved':
                return { label: 'Approved', color: '#10b981', icon: '✓', desc: 'Your appeal has been approved! Your restriction has been lifted.' };
            case 'denied':
                return { label: 'Denied', color: '#ef4444', icon: '✗', desc: 'Your appeal has been denied. Please review the decision below.' };
            case 'escalated':
                return { label: 'Escalated', color: '#8b5cf6', icon: '↑', desc: 'Your appeal has been escalated to senior staff for review.' };
            default:
                return { label: status, color: '#64748b', icon: '?', desc: '' };
        }
    };

    return (
        <div className="status-page">
            <div className="status-container">
                <div className="status-header">
                    <Link href="/appeal" className="back-link">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Appeal Form
                    </Link>
                    <h1>Check Appeal Status</h1>
                    <p>Enter your Case ID to check the status of your appeal</p>
                </div>

                <form onSubmit={handleCheck} className="status-form">
                    <div className="input-group">
                        <input
                            type="text"
                            value={caseId}
                            onChange={(e) => setCaseId(e.target.value.toUpperCase())}
                            placeholder="Enter Case ID (e.g. APL-ABC123)"
                            maxLength={10}
                        />
                        <button type="submit" disabled={loading}>
                            {loading ? (
                                <span className="spinner" />
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                            )}
                        </button>
                    </div>
                    {error && <p className="error-text">{error}</p>}
                </form>

                {appeal && (
                    <div className="appeal-result">
                        {(() => {
                            const statusInfo = getStatusInfo(appeal.status);
                            return (
                                <>
                                    <div className="status-header-card" style={{ borderColor: statusInfo.color }}>
                                        <div className="status-icon" style={{ background: `${statusInfo.color}20`, color: statusInfo.color }}>
                                            {statusInfo.icon}
                                        </div>
                                        <div className="status-text">
                                            <span className="status-label" style={{ color: statusInfo.color }}>{statusInfo.label}</span>
                                            <span className="status-desc">{statusInfo.desc}</span>
                                        </div>
                                    </div>

                                    <div className="appeal-details">
                                        <div className="detail-row">
                                            <span className="label">Case ID</span>
                                            <span className="value mono">{appeal.id}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Submitted</span>
                                            <span className="value">{new Date(appeal.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        {appeal.updated_at && appeal.updated_at !== appeal.created_at && (
                                            <div className="detail-row">
                                                <span className="label">Last Updated</span>
                                                <span className="value">{new Date(appeal.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        )}
                                    </div>

                                    {appeal.status === 'pending' && (
                                        <div className="info-box">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <path d="M12 16v-4M12 8h.01" />
                                            </svg>
                                            <p>Appeals are typically reviewed within 24-72 hours. You'll receive an email when a decision is made.</p>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}
            </div>

            <style jsx>{`
                .status-page {
                    min-height: 100vh;
                    background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                }

                .status-container {
                    width: 100%;
                    max-width: 520px;
                }

                .status-header {
                    text-align: center;
                    margin-bottom: 32px;
                }

                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.5);
                    text-decoration: none;
                    margin-bottom: 24px;
                    transition: color 0.2s;
                }

                .back-link:hover {
                    color: #60a5fa;
                }

                .back-link svg {
                    width: 18px;
                    height: 18px;
                }

                .status-header h1 {
                    font-size: 28px;
                    font-weight: 700;
                    color: #fff;
                    margin: 0 0 8px 0;
                }

                .status-header p {
                    font-size: 15px;
                    color: rgba(255, 255, 255, 0.5);
                    margin: 0;
                }

                .status-form {
                    margin-bottom: 24px;
                }

                .input-group {
                    display: flex;
                    gap: 12px;
                }

                .input-group input {
                    flex: 1;
                    padding: 16px 20px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    color: #fff;
                    font-size: 16px;
                    font-family: monospace;
                    letter-spacing: 0.05em;
                }

                .input-group input:focus {
                    outline: none;
                    border-color: #3b82f6;
                }

                .input-group input::placeholder {
                    color: rgba(255, 255, 255, 0.3);
                    font-family: inherit;
                    letter-spacing: normal;
                }

                .input-group button {
                    width: 56px;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    border: none;
                    border-radius: 12px;
                    color: #fff;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .input-group button:hover:not(:disabled) {
                    transform: scale(1.05);
                }

                .input-group button:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .input-group button svg {
                    width: 22px;
                    height: 22px;
                }

                .spinner {
                    width: 22px;
                    height: 22px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .error-text {
                    color: #ef4444;
                    font-size: 14px;
                    margin: 12px 0 0 0;
                    text-align: center;
                }

                .appeal-result {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 16px;
                    padding: 24px;
                }

                .status-header-card {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 20px;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 12px;
                    border-left: 4px solid;
                    margin-bottom: 24px;
                }

                .status-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    flex-shrink: 0;
                }

                .status-text {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .status-label {
                    font-size: 18px;
                    font-weight: 600;
                }

                .status-desc {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.6);
                }

                .appeal-details {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 0;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .detail-row:last-child {
                    border-bottom: none;
                }

                .detail-row .label {
                    font-size: 14px;
                    color: rgba(255, 255, 255, 0.5);
                }

                .detail-row .value {
                    font-size: 14px;
                    color: #fff;
                }

                .detail-row .value.mono {
                    font-family: monospace;
                    color: #60a5fa;
                }

                .info-box {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 16px;
                    background: rgba(59, 130, 246, 0.1);
                    border: 1px solid rgba(59, 130, 246, 0.2);
                    border-radius: 10px;
                    margin-top: 20px;
                }

                .info-box svg {
                    width: 20px;
                    height: 20px;
                    color: #60a5fa;
                    flex-shrink: 0;
                    margin-top: 2px;
                }

                .info-box p {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.7);
                    margin: 0;
                    line-height: 1.5;
                }
            `}</style>
        </div>
    );
}
