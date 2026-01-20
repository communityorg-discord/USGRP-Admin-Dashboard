'use client';

import Sidebar from '@/components/Sidebar';
import { useSession } from '@/hooks/useSession';

export default function CommandsPage() {
    const { session, loading, logout } = useSession();

    if (loading) return <div className="admin-layout"><div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div></div>;

    const commands = [
        { name: '/warn', desc: 'Issue a warning to a user', category: 'Moderation' },
        { name: '/mute', desc: 'Mute a user', category: 'Moderation' },
        { name: '/kick', desc: 'Kick a user from the server', category: 'Moderation' },
        { name: '/ban', desc: 'Ban a user', category: 'Moderation' },
        { name: '/unban', desc: 'Unban a user', category: 'Moderation' },
        { name: '/case', desc: 'View/edit moderation cases', category: 'Moderation' },
        { name: '/ticket', desc: 'Ticket system management', category: 'Tickets' },
        { name: '/staff', desc: 'Staff account management', category: 'Admin' },
        { name: '/autorole', desc: 'Government position assignment', category: 'Admin' },
        { name: '/fire', desc: 'Remove user from position', category: 'Admin' },
        { name: '/mail', desc: 'Send emails from Discord', category: 'Tools' },
        { name: '/backup', desc: 'Database backup management', category: 'Admin' },
    ];

    const categories = [...new Set(commands.map(c => c.category))];

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div style={{ maxWidth: '1000px' }}>
                    <div className="page-header">
                        <h1 className="page-title">Commands Reference</h1>
                        <p className="page-subtitle">Quick reference for bot commands</p>
                    </div>

                    {categories.map((cat) => (
                        <div key={cat} className="card" style={{ marginBottom: '24px' }}>
                            <div className="card-header">
                                <h3 className="card-title">{cat}</h3>
                            </div>
                            {commands.filter(c => c.category === cat).map((cmd) => (
                                <div key={cmd.name} className="case-item" style={{ padding: '12px 0' }}>
                                    <div className="case-left">
                                        <code style={{ background: 'var(--bg-tertiary)', padding: '4px 8px', borderRadius: '4px', fontWeight: 600, color: 'var(--accent-primary)' }}>{cmd.name}</code>
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', flex: 1, marginLeft: '16px' }}>{cmd.desc}</div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
