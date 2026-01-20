import { NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_ORG = 'communityorg-discord';

export async function GET() {
    if (!GITHUB_TOKEN) {
        return NextResponse.json({
            workflows: [],
            error: 'GitHub token not configured'
        });
    }

    try {
        const repos = ['USGRP-Admin-Dashboard', 'CO-Gov-Utils', 'CO-Economy-Bot'];
        const allWorkflows: Array<{
            id: number;
            name: string;
            status: string;
            conclusion: string | null;
            created_at: string;
            html_url: string;
            repo: string;
        }> = [];

        for (const repo of repos) {
            try {
                const response = await fetch(
                    `https://api.github.com/repos/${GITHUB_ORG}/${repo}/actions/runs?per_page=5`,
                    {
                        headers: {
                            Authorization: `Bearer ${GITHUB_TOKEN}`,
                            Accept: 'application/vnd.github.v3+json',
                        },
                        cache: 'no-store',
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const runs = data.workflow_runs || [];
                    allWorkflows.push(...runs.map((run: {
                        id: number;
                        name: string;
                        status: string;
                        conclusion: string | null;
                        created_at: string;
                        html_url: string;
                    }) => ({
                        id: run.id,
                        name: `${repo}: ${run.name}`,
                        status: run.status,
                        conclusion: run.conclusion,
                        created_at: run.created_at,
                        html_url: run.html_url,
                        repo,
                    })));
                }
            } catch {
                // Skip failed repos
            }
        }

        // Sort by date
        allWorkflows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return NextResponse.json({ workflows: allWorkflows.slice(0, 15) });
    } catch (error) {
        return NextResponse.json({
            workflows: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
