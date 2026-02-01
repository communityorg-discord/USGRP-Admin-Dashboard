'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
    session: {
        email?: string;
        permissionName?: string;
        discordId?: string;
        displayName?: string;
    } | null;
    onLogout: () => void;
}

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
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
// Superuser IDs (Evan S. and Dion M.)
const SUPERUSER_IDS = ['415922272956710912', '723199054514749450'];
const SUPERUSER_EMAILS = ['evans@usgrp.xyz', 'dionm@usgrp.xyz'];

// SVG Icons as components
const Icons = {
    Dashboard: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
    ),
    Documents: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    ),
    Users: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    Cases: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),
    Tickets: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
        </svg>
    ),
    Staff: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    Government: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18" />
            <path d="M5 21V7l7-4 7 4v14" />
            <path d="M9 21v-6h6v6" />
        </svg>
    ),
    Training: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
    ),
    Mail: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    ),
    External: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
    ),
    Dev: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
        </svg>
    ),
    Logout: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
    Collapse: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="11 17 6 12 11 7" />
            <polyline points="18 17 13 12 18 7" />
        </svg>
    ),
    Expand: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="13 17 18 12 13 7" />
            <polyline points="6 17 11 12 6 7" />
        </svg>
    ),
};

export default function Sidebar({ session, onLogout }: SidebarProps) {
    const pathname = usePathname();
    const isBotDeveloper = session?.discordId === BOT_DEVELOPER_ID;
    const isSuperuser = SUPERUSER_IDS.includes(session?.discordId || '') || 
                       SUPERUSER_EMAILS.includes(session?.email?.toLowerCase() || '') ||
                       session?.permissionName === 'SUPERUSER';
    
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    // Streamlined navigation structure
    const navSections: NavSection[] = [
        {
            title: 'Overview',
            items: [
                { label: 'Dashboard', href: '/dashboard', icon: <Icons.Dashboard /> },
                { label: 'Documents', href: '/documents', icon: <Icons.Documents /> },
                { label: 'User Lookup', href: '/users', icon: <Icons.Users /> },
            ],
        },
        {
            title: 'Moderation',
            items: [
                { label: 'Cases', href: '/cases', icon: <Icons.Cases /> },
                { label: 'Tickets', href: '/tickets', icon: <Icons.Tickets /> },
            ],
        },
        {
            title: 'Administration',
            items: [
                { label: 'Staff', href: '/staff', icon: <Icons.Staff /> },
                { label: 'Government', href: '/government', icon: <Icons.Government /> },
                { label: 'Training', href: '/training', icon: <Icons.Training /> },
            ],
        },
        {
            title: 'Tools',
            items: [
                { label: 'Mail Composer', href: '/mail', icon: <Icons.Mail /> },
            ],
        },
        {
            title: 'External',
            items: [
                { label: 'Webmail', href: 'https://mail.usgrp.xyz', icon: <Icons.External />, external: true },
                { label: 'Documentation', href: 'https://docs.usgrp.xyz', icon: <Icons.External />, external: true },
            ],
        },
        {
            title: 'Developer',
            botDevOnly: true,
            items: [
                { label: 'Bot Dev Console', href: '/bot-dev', icon: <Icons.Dev />, botDevOnly: true },
            ],
        },
    ];

    const visibleSections = navSections.filter(section => {
        if (section.botDevOnly && !isBotDeveloper) return false;
        return true;
    });

    const getUserInitials = () => {
        const name = session?.displayName || session?.email?.split('@')[0] || 'U';
        return name.slice(0, 2).toUpperCase();
    };

    const getRoleBadge = () => {
        if (isBotDeveloper) return { text: 'DEVELOPER', color: '#f59e0b' };
        if (isSuperuser) return { text: 'SUPERUSER', color: '#ef4444' };
        return { text: session?.permissionName || 'STAFF', color: '#3b82f6' };
    };

    const role = getRoleBadge();

    // Check if current path matches (including sub-routes)
    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href);
    };

    return (
        <>
            <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
                {/* Header */}
                <div className="sidebar-header">
                    <div className="logo">
                        <div className="logo-icon">
                            <span>U</span>
                        </div>
                        <div className="logo-text">
                            <span className="logo-title">USGRP</span>
                            <span className="logo-subtitle">Admin Portal</span>
                        </div>
                    </div>
                    <button 
                        className="collapse-toggle" 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isCollapsed ? <Icons.Expand /> : <Icons.Collapse />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {visibleSections.map((section) => (
                        <div key={section.title} className="nav-section">
                            <div 
                                className="nav-section-label"
                                style={section.botDevOnly ? { color: '#f59e0b' } : undefined}
                            >
                                {section.title}
                            </div>
                            <ul className="nav-list">
                                {section.items
                                    .filter(item => !item.botDevOnly || isBotDeveloper)
                                    .map((item) => {
                                        const active = isActive(item.href);
                                        const isHovered = hoveredItem === item.label;
                                        const LinkComponent = item.external ? 'a' : Link;
                                        const linkProps = item.external
                                            ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
                                            : { href: item.href };

                                        return (
                                            <li key={item.label}>
                                                <LinkComponent
                                                    {...linkProps}
                                                    className={`nav-link ${active ? 'active' : ''}`}
                                                    onMouseEnter={() => setHoveredItem(item.label)}
                                                    onMouseLeave={() => setHoveredItem(null)}
                                                    style={item.botDevOnly ? { color: '#f59e0b' } : undefined}
                                                >
                                                    <span className="nav-icon">{item.icon}</span>
                                                    <span className="nav-label">{item.label}</span>
                                                    {active && <span className="active-indicator" />}
                                                </LinkComponent>
                                                {isCollapsed && isHovered && (
                                                    <div className="tooltip">{item.label}</div>
                                                )}
                                            </li>
                                        );
                                    })}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* Footer / User */}
                <div className="sidebar-footer">
                    <div className="user-card">
                        <div className="user-avatar" style={{ background: `linear-gradient(135deg, ${role.color}, ${role.color}88)` }}>
                            {getUserInitials()}
                        </div>
                        <div className="user-info">
                            <span className="user-name">{session?.displayName || session?.email?.split('@')[0]}</span>
                            <span className="user-role" style={{ color: role.color }}>{role.text}</span>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={onLogout}>
                        <Icons.Logout />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            <style jsx>{`
                .sidebar {
                    width: 260px;
                    height: 100vh;
                    background: #0a0a0f;
                    border-right: 1px solid rgba(255, 255, 255, 0.06);
                    display: flex;
                    flex-direction: column;
                    transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    z-index: 100;
                    flex-shrink: 0;
                }

                .sidebar.collapsed {
                    width: 72px;
                }

                .sidebar.collapsed .logo-text,
                .sidebar.collapsed .nav-label,
                .sidebar.collapsed .nav-section-label,
                .sidebar.collapsed .user-info,
                .sidebar.collapsed .logout-btn span {
                    opacity: 0;
                    width: 0;
                    overflow: hidden;
                    white-space: nowrap;
                }

                /* Header */
                .sidebar-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px 16px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                }

                .logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .logo-icon {
                    width: 36px;
                    height: 36px;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    font-size: 16px;
                    color: white;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
                    flex-shrink: 0;
                }

                .logo-text {
                    display: flex;
                    flex-direction: column;
                    transition: opacity 0.2s, width 0.25s;
                }

                .logo-title {
                    font-size: 15px;
                    font-weight: 700;
                    color: #fff;
                    letter-spacing: -0.02em;
                }

                .logo-subtitle {
                    font-size: 11px;
                    color: #64748b;
                    font-weight: 500;
                }

                .collapse-toggle {
                    width: 28px;
                    height: 28px;
                    background: transparent;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 6px;
                    color: #64748b;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }

                .collapse-toggle:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: #fff;
                    border-color: rgba(255, 255, 255, 0.12);
                }

                .collapse-toggle :global(svg) {
                    width: 14px;
                    height: 14px;
                }

                /* Navigation */
                .sidebar-nav {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    padding: 16px 12px;
                }

                .nav-section {
                    margin-bottom: 24px;
                }

                .nav-section-label {
                    font-size: 10px;
                    font-weight: 700;
                    color: #475569;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    padding: 0 12px;
                    margin-bottom: 8px;
                    transition: opacity 0.2s, width 0.25s;
                }

                .nav-list {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                .nav-list li {
                    position: relative;
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    border-radius: 8px;
                    color: #94a3b8;
                    text-decoration: none;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.15s ease;
                    position: relative;
                    margin-bottom: 2px;
                }

                .nav-link:hover {
                    background: rgba(255, 255, 255, 0.04);
                    color: #e2e8f0;
                }

                .nav-link.active {
                    background: rgba(59, 130, 246, 0.1);
                    color: #60a5fa;
                }

                .nav-icon {
                    width: 20px;
                    height: 20px;
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .nav-icon :global(svg) {
                    width: 18px;
                    height: 18px;
                }

                .nav-label {
                    transition: opacity 0.2s, width 0.25s;
                    white-space: nowrap;
                }

                .active-indicator {
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 3px;
                    height: 20px;
                    background: #3b82f6;
                    border-radius: 0 3px 3px 0;
                    box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
                }

                .tooltip {
                    position: absolute;
                    left: calc(100% + 12px);
                    top: 50%;
                    transform: translateY(-50%);
                    background: #1e293b;
                    color: #fff;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    white-space: nowrap;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    z-index: 1000;
                    pointer-events: none;
                }

                .tooltip::before {
                    content: '';
                    position: absolute;
                    left: -4px;
                    top: 50%;
                    transform: translateY(-50%);
                    border: 4px solid transparent;
                    border-right-color: #1e293b;
                }

                /* Footer */
                .sidebar-footer {
                    padding: 16px 12px;
                    border-top: 1px solid rgba(255, 255, 255, 0.04);
                }

                .user-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 10px;
                    margin-bottom: 12px;
                }

                .user-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 13px;
                    font-weight: 700;
                    color: white;
                    flex-shrink: 0;
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    transition: opacity 0.2s, width 0.25s;
                }

                .user-name {
                    font-size: 13px;
                    font-weight: 600;
                    color: #e2e8f0;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .user-role {
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                }

                .logout-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 10px;
                    background: rgba(239, 68, 68, 0.08);
                    border: 1px solid rgba(239, 68, 68, 0.15);
                    border-radius: 8px;
                    color: #f87171;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .logout-btn:hover {
                    background: rgba(239, 68, 68, 0.15);
                    border-color: rgba(239, 68, 68, 0.25);
                }

                .logout-btn :global(svg) {
                    width: 16px;
                    height: 16px;
                    flex-shrink: 0;
                }

                .logout-btn span {
                    transition: opacity 0.2s, width 0.25s;
                }

                /* Scrollbar */
                .sidebar-nav::-webkit-scrollbar {
                    width: 4px;
                }

                .sidebar-nav::-webkit-scrollbar-track {
                    background: transparent;
                }

                .sidebar-nav::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 4px;
                }

                .sidebar-nav::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.15);
                }
            `}</style>
        </>
    );
}
