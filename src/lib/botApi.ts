/**
 * Bot API Client
 * Connects the dashboard to the CO-Gov-Utils bot API
 */

// API Configuration - hardcoded as requested
const API_CONFIG = {
    baseUrl: 'http://localhost:3003',
    apiKey: 'usgrp-admin-2026-secure-key-x7k9m2p4'
};

export interface StatsResponse {
    cases: {
        total: number;
        warns: number;
        mutes: number;
        kicks: number;
        bans: number;
        active: number;
    };
    tickets: {
        total: number;
        open: number;
        closed: number;
    };
    activity: {
        messages: number;
        voiceMinutes: number;
        uniqueUsers: number;
    };
    staff: number;
    members: number;
}

export interface UserResponse {
    user: {
        id: string;
        username?: string;
        displayName?: string;
        avatar?: string;
        nickname?: string;
        roles?: Array<{ id: string; name: string; color: string }>;
        joinedAt?: string;
        permissionLevel?: number;
        inGuild?: boolean;
    };
    cases: Case[];
    caseCount: number;
    activity: {
        totalMessages: number;
        totalVoice: number;
        activeDays: number;
        daily: Array<{ date: string; message_count: number; voice_minutes: number }>;
    };
}

export interface Case {
    id: number;
    case_id: string;
    guild_id: string;
    user_id: string;
    user_tag: string;
    moderator_id: string;
    moderator_tag: string;
    action_type: string;
    reason: string;
    evidence?: string;
    duration?: number;
    points: number;
    status: string;
    created_at: string;
}

export interface AuthResponse {
    success: boolean;
    discordId?: string;
    email?: string;
    displayName?: string;
    permissionLevel?: number;
    permissionName?: string;
    error?: string;
}

class BotApiClient {
    private baseUrl: string;
    private apiKey: string;

    constructor() {
        this.baseUrl = API_CONFIG.baseUrl;
        this.apiKey = API_CONFIG.apiKey;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Key': this.apiKey,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(error.error || 'API request failed');
        }

        return response.json();
    }

    // Auth
    async login(email: string): Promise<AuthResponse> {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    // Stats
    async getStats(): Promise<StatsResponse> {
        return this.request('/api/stats');
    }

    // Users
    async getUser(userId: string): Promise<UserResponse> {
        return this.request(`/api/users/${userId}`);
    }

    async getUserCases(userId: string): Promise<Case[]> {
        return this.request(`/api/users/${userId}/cases`);
    }

    // Cases
    async getCases(filters?: { status?: string; actionType?: string; limit?: number }): Promise<Case[]> {
        const params = new URLSearchParams();
        if (filters?.status) params.set('status', filters.status);
        if (filters?.actionType) params.set('actionType', filters.actionType);
        if (filters?.limit) params.set('limit', filters.limit.toString());

        return this.request(`/api/cases?${params.toString()}`);
    }

    async getCase(caseId: string): Promise<Case> {
        return this.request(`/api/cases/${caseId}`);
    }

    async createCase(data: {
        userId: string;
        actionType: string;
        reason: string;
        evidence?: string;
        duration?: number;
        points?: number;
        moderatorId: string;
    }): Promise<{ success: boolean; case: Case }> {
        return this.request('/api/cases', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async editCase(caseId: string, data: {
        editorId: string;
        editorTag: string;
        changes: Record<string, string | number>;
        editReason: string;
    }): Promise<{ success: boolean; case: Case }> {
        return this.request(`/api/cases/${caseId}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteCase(caseId: string, deletedBy: string): Promise<{ success: boolean }> {
        return this.request(`/api/cases/${caseId}`, {
            method: 'DELETE',
            body: JSON.stringify({ deletedBy }),
        });
    }

    // Activity
    async getDailyActivity(days: number = 7) {
        return this.request(`/api/activity/daily?days=${days}`);
    }

    async getTopUsers(days: number = 30, limit: number = 10) {
        return this.request(`/api/activity/top?days=${days}&limit=${limit}`);
    }

    // Staff
    async getStaffList() {
        return this.request('/api/staff');
    }

    async getStaffMember(discordId: string) {
        return this.request(`/api/staff/${discordId}`);
    }
}

// Singleton instance
export const botApi = new BotApiClient();
