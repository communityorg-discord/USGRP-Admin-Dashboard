import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface PM2Process {
    name: string;
    status: 'online' | 'stopped' | 'errored' | 'unknown';
    memory: number;
    cpu: number;
    uptime: number;
    restarts: number;
}

interface SystemStatus {
    services: PM2Process[];
    disk: { used: number; total: number; percent: number };
    memory: { used: number; total: number; percent: number };
    uptime: number;
    timestamp: string;
}

export async function GET() {
    try {
        // Get PM2 processes
        let services: PM2Process[] = [];
        try {
            const { stdout } = await execAsync('pm2 jlist');
            const pm2Data = JSON.parse(stdout);
            services = pm2Data.map((p: any) => ({
                name: p.name,
                status: p.pm2_env?.status || 'unknown',
                memory: Math.round((p.monit?.memory || 0) / 1024 / 1024), // MB
                cpu: p.monit?.cpu || 0,
                uptime: p.pm2_env?.pm_uptime ? Date.now() - p.pm2_env.pm_uptime : 0,
                restarts: p.pm2_env?.restart_time || 0,
            }));
        } catch (e) {
            console.error('PM2 fetch error:', e);
        }

        // Get disk usage
        let disk = { used: 0, total: 0, percent: 0 };
        try {
            const { stdout } = await execAsync("df -B1 / | tail -1 | awk '{print $2, $3, $5}'");
            const [total, used, percent] = stdout.trim().split(/\s+/);
            disk = {
                total: Math.round(parseInt(total) / 1024 / 1024 / 1024), // GB
                used: Math.round(parseInt(used) / 1024 / 1024 / 1024), // GB
                percent: parseInt(percent.replace('%', '')),
            };
        } catch (e) {
            console.error('Disk fetch error:', e);
        }

        // Get memory usage
        let memory = { used: 0, total: 0, percent: 0 };
        try {
            const { stdout } = await execAsync("free -b | grep Mem | awk '{print $2, $3}'");
            const [total, used] = stdout.trim().split(/\s+/);
            memory = {
                total: Math.round(parseInt(total) / 1024 / 1024 / 1024), // GB
                used: Math.round(parseInt(used) / 1024 / 1024 / 1024), // GB
                percent: Math.round((parseInt(used) / parseInt(total)) * 100),
            };
        } catch (e) {
            console.error('Memory fetch error:', e);
        }

        // Get system uptime
        let uptime = 0;
        try {
            const { stdout } = await execAsync("cat /proc/uptime | awk '{print $1}'");
            uptime = Math.round(parseFloat(stdout.trim()));
        } catch (e) {
            console.error('Uptime fetch error:', e);
        }

        const status: SystemStatus = {
            services,
            disk,
            memory,
            uptime,
            timestamp: new Date().toISOString(),
        };

        return NextResponse.json(status);
    } catch (error) {
        console.error('System status error:', error);
        return NextResponse.json({ error: 'Failed to get system status' }, { status: 500 });
    }
}
