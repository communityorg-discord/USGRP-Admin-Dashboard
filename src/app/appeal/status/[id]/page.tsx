'use client';

import Link from 'next/link';
import { use } from 'react';

export default function AppealStatusPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    return (
        <div className="appeal-container">
            <div className="appeal-card">
                <div className="appeal-header">
                    <div className="appeal-logo">📋</div>
                    <h1>Appeal Status</h1>
                    <p>Reference: {id}</p>
                </div>

                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div className="status-badge status-pending">PENDING REVIEW</div>
                    <p style={{ color: 'var(--text-muted)', marginTop: '16px', marginBottom: '24px' }}>
                        Your appeal is currently being reviewed by our staff team. You will receive an email notification when a decision has been made.
                    </p>
                </div>

                <div className="appeal-footer">
                    <Link href="/">Back to Login</Link>
                </div>
            </div>
        </div>
    );
}
