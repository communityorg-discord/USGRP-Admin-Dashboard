'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
    session: {
        email?: string;
        permissionName?: string;
        discordId?: string;
    } | null;
    onLogout: () => void;
}

interface NavItem {
    label: string;
    href: string;
    icon: string;
    external?: boolean;
    botDevOnly?: boolean;
}

interface NavSection {
    title: string;
    items: NavItem[];
    botDevOnly?: boolean;
}

// Bot Developer Discord ID
const BOT_DEVELOPER_ID = '723199054514749450';

export default function Sidebar({ session, onLogout }: SidebarProps) {
    const pathname = usePathname();
    const isBotDeveloper = session?.discordId === BOT_DEVELOPER_ID;

    const navSections: NavSection[] = [
        {
            title: 'Main',
            items: [
                { label: 'Dashboard', href: '/dashboard', icon: '⌂' },
                { label: 'User Lookup', href: '/users', icon: '⌕' },
                { label: 'Cases', href: '/cases', icon: '☰' },
                { label: 'Tickets', href: '/tickets', icon: '✉' },
                { label: 'Analytics', href: '/analytics', icon: '◔' },
            ],
        },
        {
            title: 'Administration',
            items: [
                { label: 'Staff', href: '/staff-dashboard', icon: '⊞' },
                { label: 'Government', href: '/government', icon: '⚑' },
                { label: 'Appeals', href: '/appeals', icon: '⚖' },
                { label: 'Backups', href: '/backups', icon: '⟳' },
            ],
        },
        {
            title: 'Tools',
            items: [
                { label: 'Commands', href: '/commands', icon: '⌘' },
                { label: 'Mail Composer', href: '/mail', icon: '✎' },
            ],
        },
        {
            title: 'External',
            items: [
                { label: 'Webmail', href: 'https://mail.usgrp.xyz', icon: '↗', external: true },
                { label: 'Recordings', href: 'https://recordings.usgrp.xyz', icon: '↗', external: true },
            ],
        },
        // Bot Developer section - only visible to bot developer
        {
            title: 'Developer',
            botDevOnly: true,
            items: [
                { label: 'Bot Dev Console', href: '/bot-dev', icon: '🛠️', botDevOnly: true },
            ],
        },
    ];

    // Filter sections based on permissions
    const visibleSections = navSections.filter(section => {
        if (section.botDevOnly && !isBotDeveloper) return false;
        return true;
    });

    return (
        <aside className="admin-sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">U</div>
                    <div className="sidebar-logo-text">
                        <h1>USGRP Admin</h1>
                        <span>admin.usgrp.xyz</span>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {visibleSections.map((section) => (
                    <div key={section.title} className="nav-section">
                        <div className="nav-section-title" style={section.botDevOnly ? { color: 'var(--gov-gold)' } : undefined}>
                            {section.title}
                        </div>
                        {section.items
                            .filter(item => !item.botDevOnly || isBotDeveloper)
                            .map((item) => {
                                const isActive = pathname === item.href;
                                const LinkComponent = item.external ? 'a' : Link;
                                const linkProps = item.external
                                    ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
                                    : { href: item.href };

                                return (
                                    <LinkComponent
                                        key={item.label}
                                        {...linkProps}
                                        className={`nav-item ${isActive ? 'active' : ''}`}
                                        style={item.botDevOnly ? { color: 'var(--gov-gold)' } : undefined}
                                    >
                                        <span className="nav-item-icon">{item.icon}</span>
                                        {item.label}
                                        {item.external && <span className="nav-external">↗</span>}
                                    </LinkComponent>
                                );
                            })}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div className="user-email">{session?.email}</div>
                    <div className="user-role" style={isBotDeveloper ? { color: 'var(--gov-gold)' } : undefined}>
                        {isBotDeveloper ? '🛠️ BOT_DEVELOPER' : session?.permissionName || 'MODERATOR'}
                    </div>
                </div>
                <button onClick={onLogout} className="logout-btn">
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
