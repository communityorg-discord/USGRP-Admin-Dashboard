'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
    session: {
        email?: string;
        permissionName?: string;
    } | null;
    onLogout: () => void;
}

interface NavItem {
    label: string;
    href: string;
    icon: string;
    external?: boolean;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

export default function Sidebar({ session, onLogout }: SidebarProps) {
    const pathname = usePathname();

    const navSections: NavSection[] = [
        {
            title: 'Main',
            items: [
                { label: 'Dashboard', href: '/dashboard', icon: '📊' },
                { label: 'User Lookup', href: '/users', icon: '🔍' },
                { label: 'Cases', href: '/cases', icon: '📋' },
                { label: 'Tickets', href: '/tickets', icon: '🎫' },
                { label: 'Analytics', href: '/analytics', icon: '📈' },
            ],
        },
        {
            title: 'Administration',
            items: [
                { label: 'Staff', href: '/staff-dashboard', icon: '👥' },
                { label: 'Government', href: '/government', icon: '🏛️' },
                { label: 'Appeals', href: '/appeals', icon: '⚖️' },
                { label: 'Backups', href: '/backups', icon: '💾' },
            ],
        },
        {
            title: 'Tools',
            items: [
                { label: 'Commands', href: '/commands', icon: '⌨️' },
                { label: 'Mail Composer', href: '/mail', icon: '✉️' },
            ],
        },
        {
            title: 'External',
            items: [
                { label: 'Webmail', href: 'https://mail.usgrp.xyz', icon: '📧', external: true },
                { label: 'Recordings', href: 'https://recordings.usgrp.xyz', icon: '🎬', external: true },
            ],
        },
    ];

    return (
        <aside className="admin-sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">🛡️</div>
                    <div className="sidebar-logo-text">
                        <h1>USGRP Admin</h1>
                        <span>admin.usgrp.xyz</span>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navSections.map((section) => (
                    <div key={section.title} className="nav-section">
                        <div className="nav-section-title">{section.title}</div>
                        {section.items.map((item) => {
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
                    <div className="user-role">{session?.permissionName || 'MODERATOR'}</div>
                </div>
                <button onClick={onLogout} className="logout-btn">
                    🚪 Sign Out
                </button>
            </div>
        </aside>
    );
}
