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

    if (sessionLoading) return <div className="admin-layout"><div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div></div>;

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div>
                    <div className="page-header">
                        <h1 className="page-title">Mail Composer</h1>
                        <p className="page-subtitle">Send emails from your USGRP account</p>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">✉️ New Email</h3>
                        </div>

                        <div style={{ padding: '20px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="form-label">From</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={session?.email || ''}
                                    disabled
                                    style={{ background: 'var(--bg-primary)', opacity: 0.7 }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label className="form-label">To</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="recipient@example.com"
                                    value={to}
                                    onChange={e => setTo(e.target.value)}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label className="form-label">Subject</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Email subject"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label className="form-label">Message</label>
                                <textarea
                                    className="form-input"
                                    placeholder="Write your message..."
                                    rows={8}
                                    value={body}
                                    onChange={e => setBody(e.target.value)}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            {status && (
                                <div className={status.type === 'success' ? 'alert-success' : 'alert-warning'} style={{ marginBottom: '16px' }}>
                                    {status.message}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn btn-primary" onClick={handleSend} disabled={sending}>
                                    {sending ? 'Sending...' : '📤 Send Email'}
                                </button>
                                <button className="btn btn-secondary" onClick={() => { setTo(''); setSubject(''); setBody(''); setStatus(null); }}>
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
