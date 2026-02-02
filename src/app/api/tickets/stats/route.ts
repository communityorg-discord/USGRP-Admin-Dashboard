import { NextResponse } from 'next/server';

const BOT_API_URL = 'http://localhost:3320';
const BOT_API_KEY = 'usgrp-admin-2026-secure-key-x7k9m2p4';

interface Ticket {
    id: string;
    user_id: string;
    user_tag?: string;
    subject?: string;
    status: string;
    created_at: string;
    closed_at?: string;
    claimed_by?: string;
    claimed_by_tag?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    category?: string;
}

export async function GET() {
    try {
        const response = await fetch(`${BOT_API_URL}/api/tickets`, {
            headers: { 'X-Admin-Key': BOT_API_KEY },
            cache: 'no-store'
        });

        if (!response.ok) {
            return NextResponse.json({ tickets: [], stats: getEmptyStats() });
        }

        const tickets: Ticket[] = await response.json();
        
        // Calculate stats
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const openTickets = tickets.filter(t => t.status === 'open');
        const closedTickets = tickets.filter(t => t.status === 'closed');
        const claimedTickets = openTickets.filter(t => t.claimed_by);
        const unclaimedTickets = openTickets.filter(t => !t.claimed_by);
        
        // Calculate average response time (time to claim)
        let avgResponseTime = 0;
        const claimedWithTime = tickets.filter(t => t.claimed_by && t.created_at);
        if (claimedWithTime.length > 0) {
            // Estimate based on creation to now for open, or creation to close for closed
            // This is simplified - real implementation would track claim time
            avgResponseTime = 15; // placeholder in minutes
        }
        
        // Calculate average resolution time
        let avgResolutionTime = 0;
        const resolved = closedTickets.filter(t => t.created_at && t.closed_at);
        if (resolved.length > 0) {
            const times = resolved.map(t => {
                const created = new Date(t.created_at).getTime();
                const closed = new Date(t.closed_at!).getTime();
                return (closed - created) / (1000 * 60); // minutes
            });
            avgResolutionTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        }
        
        // Tickets opened this week
        const openedThisWeek = tickets.filter(t => new Date(t.created_at) >= weekAgo).length;
        const closedThisWeek = closedTickets.filter(t => t.closed_at && new Date(t.closed_at) >= weekAgo).length;
        
        // Staff leaderboard (by claims/closes)
        const staffMap = new Map<string, { tag: string; claimed: number; closed: number }>();
        tickets.forEach(t => {
            if (t.claimed_by) {
                const existing = staffMap.get(t.claimed_by) || { tag: t.claimed_by_tag || 'Unknown', claimed: 0, closed: 0 };
                existing.claimed++;
                if (t.status === 'closed') existing.closed++;
                staffMap.set(t.claimed_by, existing);
            }
        });
        const staffLeaderboard = Array.from(staffMap.entries())
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.closed - a.closed)
            .slice(0, 5);
        
        const stats = {
            total: tickets.length,
            open: openTickets.length,
            closed: closedTickets.length,
            claimed: claimedTickets.length,
            unclaimed: unclaimedTickets.length,
            avgResponseTime,
            avgResolutionTime,
            openedThisWeek,
            closedThisWeek,
            staffLeaderboard,
        };

        return NextResponse.json({ tickets, stats });
    } catch (error) {
        console.error('Bot API connection failed:', error);
        return NextResponse.json({ tickets: [], stats: getEmptyStats() });
    }
}

function getEmptyStats() {
    return {
        total: 0,
        open: 0,
        closed: 0,
        claimed: 0,
        unclaimed: 0,
        avgResponseTime: 0,
        avgResolutionTime: 0,
        openedThisWeek: 0,
        closedThisWeek: 0,
        staffLeaderboard: [],
    };
}
