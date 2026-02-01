'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSession } from '@/hooks/useSession';

export default function MailPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleSend = async () => {
        if (!to || !subject || !body) {
            setStatus({ type: 'error', message: 'All fields are required' });
            return;
        }

        setSending(true);
        setStatus(null);

        try {
            const res = await fetch('/api/mail/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to, subject, body }),
            });

            if (res.ok) {
                setStatus({ type: 'success', message: 'Email sent successfully!' });
                setTo('');
                setSubject('');
                setBody('');
            } else {
                const data = await res.json();
                setStatus({ type: 'error', message: data.error || 'Failed to send email' });
            }
        } catch {
            setStatus({ type: 'error', message: 'Failed to send email' });
        } finally {
            setSending(false);
        }
    };

    if (sessionLoading) {
        return (
            <div className="admin-layout">
                <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div>
                    {/* Header */}
                    <div className="page-header">
                        <h1 className="page-title">Mail Composer</h1>
                        <p className="page-subtitle">Send emails from your @usgrp.xyz address</p>
                    </div>

                    {/* Compose Card */}
                    <div className="compose-card">
                        <div className="compose-header">
                            <h3>New Message</h3>
                            <span className="from-address">From: {session?.email || 'your-email@usgrp.xyz'}</span>
                        </div>

                        <div className="compose-body">
                            <div className="form-row">
                                <label>To</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="recipient@example.com"
                                    value={to}
                                    onChange={e => setTo(e.target.value)}
                                />
                            </div>

                            <div className="form-row">
                                <label>Subject</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter subject..."
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                />
                            </div>

                            <div className="form-row">
                                <label>Message</label>
                                <textarea
                                    className="form-input"
                                    placeholder="Write your message..."
                                    rows={12}
                                    value={body}
                                    onChange={e => setBody(e.target.value)}
                                />
                            </div>

                            {status && (
                                <div className={`status-message ${status.type}`}>
                                    {status.type === 'success' ? '✓' : '✕'} {status.message}
                                </div>
                            )}

                            <div className="compose-actions">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSend}
                                    disabled={sending}
                                >
                                    {sending ? 'Sending...' : 'Send Email'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx>{`
                .page-header {
                    margin-bottom: 24px;
                }

                .page-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin-bottom: 4px;
                }

                .page-subtitle {
                    font-size: 15px;
                    color: var(--text-muted);
                }

                .compose-card {
                    background: var(--bg-elevated);
                    border: 1px solid var(--border-subtle);
                    border-radius: 12px;
                    overflow: hidden;
                    max-width: 700px;
                }

                .compose-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid var(--border-subtle);
                }

                .compose-header h3 {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary);
                }

                .from-address {
                    font-size: 13px;
                    color: var(--text-muted);
                }

                .compose-body {
                    padding: 24px;
                }

                .form-row {
                    margin-bottom: 20px;
                }

                .form-row label {
                    display: block;
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 8px;
                }

                .form-row textarea {
                    resize: vertical;
                    min-height: 200px;
                    font-family: inherit;
                    line-height: 1.6;
                }

                .status-message {
                    padding: 12px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    margin-bottom: 20px;
                }

                .status-message.success {
                    background: rgba(16, 185, 129, 0.1);
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    color: #34d399;
                }

                .status-message.error {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #f87171;
                }

                .compose-actions {
                    display: flex;
                    justify-content: flex-end;
                }
            `}</style>
        </div>
    );
}
