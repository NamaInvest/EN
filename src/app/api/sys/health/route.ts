import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import os from 'os';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // 1. Database Health
    const dbStart = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = (performance.now() - dbStart).toFixed(2);

    // 2. Hardware / OS Status
    const system = {
        uptime: os.uptime(),
        totalMem: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2), // GB
        freeMem: (os.freemem() / 1024 / 1024 / 1024).toFixed(2), // GB
        cpus: os.cpus().length,
        loadAvg: os.loadavg()[0].toFixed(2)
    };

    // 3. Extracting PM2 Nodes Status securely
    const pm2Status = await new Promise((resolve) => {
        exec('pm2 jlist', (error, stdout) => {
            if (error) {
                return resolve([]);
            }
            try {
                const processes = JSON.parse(stdout);
                resolve(processes.map((p: any) => ({
                    name: p.name,
                    status: p.pm2_env.status,
                    memory: (p.monit.memory / 1024 / 1024).toFixed(1) + ' MB',
                    cpu: p.monit.cpu + '%',
                    uptime: Math.floor((Date.now() - p.pm2_env.pm_uptime) / 1000) + 's',
                    restarts: p.pm2_env.restart_time
                })));
            } catch (e) {
                resolve([]);
            }
        });
    });

    return NextResponse.json({
        database: { status: 'ONLINE', latency: dbLatency + ' ms' },
        system,
        nodes: pm2Status
    });
  } catch (error: any) {
    console.error('System Health API Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve system health' }, { status: 500 });
  }
}
