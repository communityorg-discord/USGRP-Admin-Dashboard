'use client';

import { useState } from 'react';
import Link from 'next/link';

// Commands data from CO-Gov-Utils
const commands = [
    { name: '/warn', category: 'Moderation', description: 'Issue warnings with point tracking', permission: 'Moderator' },
    { name: '/mute', category: 'Moderation', description: 'Timeout users with case logging', permission: 'Moderator' },
    { name: '/unmute', category: 'Moderation', description: 'Remove mutes from users', permission: 'Moderator' },
    { name: '/kick', category: 'Moderation', description: 'Kick users with case logging', permission: 'Moderator' },
    { name: '/ban', category: 'Moderation', description: 'Ban users with case logging', permission: 'Senior Mod' },
    { name: '/unban', category: 'Moderation', description: 'Unban users', permission: 'Senior Mod' },
    { name: '/softban', category: 'Moderation', description: 'Ban and immediately unban to clear messages', permission: 'Moderator' },
    { name: '/purge', category: 'Moderation', description: 'Bulk delete messages', permission: 'Moderator' },
    { name: '/massban', category: 'Moderation', description: 'Ban multiple users at once', permission: 'Admin' },

    { name: '/case view', category: 'Cases', description: 'View case details and edit history', permission: 'Moderator' },
    { name: '/case edit', category: 'Cases', description: 'Edit case reason/evidence/points', permission: 'Senior Mod' },
    { name: '/case delete', category: 'Cases', description: 'Soft delete a case', permission: 'Admin' },
    { name: '/case void', category: 'Cases', description: 'Hard delete a case', permission: 'Admin' },
    { name: '/case restore', category: 'Cases', description: 'Restore a deleted case', permission: 'Admin' },
    { name: '/view-history', category: 'Cases', description: 'View user moderation history', permission: 'Moderator' },
    { name: '/deleted-history', category: 'Cases', description: 'View deleted cases', permission: 'Senior Mod' },

    { name: '/investigation open', category: 'Investigations', description: 'Open investigation, create channel', permission: 'Admin' },
    { name: '/investigation close', category: 'Investigations', description: 'Close with outcome, archive', permission: 'Admin' },
    { name: '/investigation view', category: 'Investigations', description: 'View investigation details', permission: 'Senior Mod' },
    { name: '/investigation list', category: 'Investigations', description: 'List open investigations', permission: 'Senior Mod' },

    { name: '/autorole assign', category: 'Staff', description: 'Assign government positions', permission: 'HR' },
    { name: '/autorole remove', category: 'Staff', description: 'Remove positions', permission: 'HR' },
    { name: '/autorole list', category: 'Staff', description: 'List all assignments', permission: 'User' },
    { name: '/autorole view', category: 'Staff', description: 'View user positions', permission: 'User' },
    { name: '/fire', category: 'Staff', description: 'Remove all roles except Member', permission: 'HR' },

    { name: '/record start', category: 'Voice', description: 'Start recording a voice channel', permission: 'Moderator' },
    { name: '/record stop', category: 'Voice', description: 'Stop recording and get download link', permission: 'Moderator' },
    { name: '/vc', category: 'Voice', description: 'Voice channel management', permission: 'Moderator' },
    { name: '/queue', category: 'Voice', description: 'Speaking queue management', permission: 'User' },

    { name: '/ticket create', category: 'Tickets', description: 'Create a support ticket', permission: 'User' },
    { name: '/ticket close', category: 'Tickets', description: 'Close a ticket', permission: 'Moderator' },
    { name: '/ticket add', category: 'Tickets', description: 'Add user to ticket', permission: 'Moderator' },

    { name: '/backup create', category: 'Backups', description: 'Create server backup', permission: 'Admin' },
    { name: '/backup list', category: 'Backups', description: 'List available backups', permission: 'Admin' },
    { name: '/backup restore', category: 'Backups', description: 'Restore from backup', permission: 'Superuser' },

    { name: '/automod', category: 'AutoMod', description: 'Configure auto-moderation', permission: 'Admin' },
    { name: '/filter', category: 'AutoMod', description: 'Word filter management', permission: 'Senior Mod' },
    { name: '/raid-mode', category: 'AutoMod', description: 'Toggle raid protection', permission: 'Admin' },
    { name: '/lockdown', category: 'AutoMod', description: 'Channel/server lockdown', permission: 'Admin' },

    { name: '/watchlist add', category: 'Monitoring', description: 'Add user to watchlist', permission: 'Moderator' },
    { name: '/watchlist remove', category: 'Monitoring', description: 'Remove from watchlist', permission: 'Moderator' },
    { name: '/notes', category: 'Monitoring', description: 'Manage staff notes on users', permission: 'Moderator' },
    { name: '/audit-log', category: 'Monitoring', description: 'View audit log entries', permission: 'Admin' },
    { name: '/modstats', category: 'Monitoring', description: 'View moderation statistics', permission: 'Moderator' },

    { name: '/setup', category: 'Config', description: 'Server setup wizard', permission: 'Admin' },
    { name: '/permissions', category: 'Config', description: 'Manage command permissions', permission: 'Admin' },
    { name: '/sticky', category: 'Config', description: 'Sticky message management', permission: 'Moderator' },

    { name: '/help', category: 'Utility', description: 'View help and command list', permission: 'User' },
    { name: '/ping', category: 'Utility', description: 'Check bot latency', permission: 'User' },
    { name: '/info', category: 'Utility', description: 'View user/server info', permission: 'User' },
];

const categories = [...new Set(commands.map(c => c.category))];
const permissionColors: Record<string, string> = {
    'User': 'text-green-400 bg-green-500/10',
    'Moderator': 'text-blue-400 bg-blue-500/10',
    'Senior Mod': 'text-purple-400 bg-purple-500/10',
    'Admin': 'text-orange-400 bg-orange-500/10',
    'HR': 'text-pink-400 bg-pink-500/10',
    'Superuser': 'text-red-400 bg-red-500/10',
};

export default function CommandsPage() {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const filtered = commands.filter(cmd => {
        const matchesSearch = cmd.name.toLowerCase().includes(search.toLowerCase()) ||
            cmd.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = !selectedCategory || cmd.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-[#0a0a0f] p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors">
                        ← Back
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Bot Commands</h1>
                        <p className="text-gray-500">Browse all {commands.length} available commands</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="glass-card p-4 mb-6 flex flex-wrap gap-4">
                    <input
                        type="text"
                        placeholder="Search commands..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-field flex-1 min-w-[200px]"
                    />
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-2 rounded-lg transition-colors ${!selectedCategory ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            All
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-lg transition-colors ${selectedCategory === cat ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Commands List */}
                <div className="space-y-3">
                    {filtered.map((cmd, i) => (
                        <div key={i} className="glass-card p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <code className="text-cyan-400 font-mono text-lg">{cmd.name}</code>
                                <span className="text-gray-400">{cmd.description}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-gray-500 text-sm">{cmd.category}</span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${permissionColors[cmd.permission]}`}>
                                    {cmd.permission}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No commands found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
}
