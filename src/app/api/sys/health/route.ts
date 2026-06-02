import { NextRequest, NextResponse } from 'next/server';
import { withRoute } from '@/lib/api/with-route';
import { exec } from 'child_process';
import os from 'os';
import { prisma } from '@/lib/prisma';

import { getUserFromRequest } from '@/lib/auth';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'sys.health' });

interface Pm2Cache {
  data: any[];
  lastUpdated: number;
}
let pm2CacheInstance: Pm2Cache | null = null;
const CACHE_TTL_MS = 15000; // 15 seconds

async function getCachedPm2Metrics(): Promise<any[]> {
  const now = Date.now();
  if (pm2CacheInstance && (now - pm2CacheInstance.lastUpdated) < CACHE_TTL_MS) {
    return pm2CacheInstance.data;
  }

  const freshData = await new Promise<any[]>((resolve) => {
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
      } catch (e: any) {
        log.error('src/app/api/sys/health/route.ts - PM2 Cache updating failed', { error: e instanceof Error ? e.message : e });
        resolve([]);
      }
    });
  });

  pm2CacheInstance = { data: freshData, lastUpdated: now };
  return freshData;
}

async function _GET(request: NextRequest) {
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

    // 3. Extracting PM2 Nodes Status securely using cache
    const pm2Status = await getCachedPm2Metrics();

    return NextResponse.json({
        database: { status: 'ONLINE', latency: dbLatency + ' ms' },
        system,
        nodes: pm2Status
    });
  } catch (error: any) {
    log.error('System Health API Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve system health' }, { status: 500 });
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

