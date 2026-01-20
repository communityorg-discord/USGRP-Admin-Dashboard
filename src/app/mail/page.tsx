'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function MailPage() {
    const router = useRouter();
    const [session, setSession] = useState<{ email?: string; permissionName?: string } | null>(null);
    const [form, setForm] = useState({
        to: '',
        subject: '',
        body: '',
    });
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        fetch('/api/auth/session')
            .then(res => res.json())
            .then(data => {
                if (!data.authenticated) {
                    router.push('/');
                } else {
                    setSession(data);
                }
            });
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/');
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setResult(null);

        try {
            const res = await fetch('/api/mail/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    from: session?.email,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setResult({ type: 'success', message: 'Email sent successfully!' });
                setForm({ to: '', subject: '', body: '' });
            } else {
                setResult({ type: 'error', message: data.error || 'Failed to send email' });
            }
        } catch {
            setResult({ type: 'error', message: 'Connection error' });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={handleLogout} />

            <main className="admin-main">
                <div style={{ maxWidth: '800px' }}>
                    <div className="page-header">
                        <h1 className="page-title">Mail Composer</h1>
                        <p className="page-subtitle">Send emails to staff members</p>
                    </div>

                    <div className="card">
                        <form onSubmit={handleSend}>
                            <div className="form-row">
                                <label className="form-label">From</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={session?.email || ''}
                                    disabled
                                    style={{ opacity: 0.7 }}
                                />
                            </div>
                            <div className="form-row">
                                <label className="form-label">To *</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="recipient@usgrp.xyz"
                                    value={form.to}
                                    onChange={(e) => setForm({ ...form, to: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <label className="form-label">Subject *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Email subject..."
                                    value={form.subject}
                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <label className="form-label">Message *</label>
                                <textarea
                                    className="form-textarea"
                                    placeholder="Write your message..."
                                    value={form.body}
                                    onChange={(e) => setForm({ ...form, body: e.target.value })}
                                    required
                                    style={{ minHeight: '200px' }}
                                />
                            </div>

                            {result && (
                                <div className={`alert-${result.type === 'success' ? 'success' : 'warning'}`} style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', background: result.type === 'success' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)', border: `1px solid ${result.type === 'success' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}`, color: result.type === 'success' ? '#81c784' : '#ef5350' }}>
                                    {result.type === 'success' ? '✓' : '✕'} {result.message}
                                </div>
                            )}

                            <div className="form-actions" style={{ borderTop: 'none', paddingTop: 0 }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setForm({ to: '', subject: '', body: '' })}>
                                    Clear
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={sending}>
                                    {sending ? 'Sending...' : '📤 Send Email'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
