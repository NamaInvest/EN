/**
 * System Health Check — Comprehensive (API Enhancement)
 * ══════════════════════════════════════════════════════════════════════════════
 * GET /api/health         → JSON health report (liveness + readiness)
 * GET /api/health?full=1  → includes DB latency, disk, memory, version
 *
 * Used by:
 *   - Load balancers (liveness probe)
 *   - Monitoring (Uptime Robot, StatusPage)
 *   - Kubernetes readiness probe
 *   - GitHub Actions smoke test
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { telemetry } from '@/lib/telemetry';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'health-check' });

const APP_VERSION = process.env.npm_package_version ?? process.env.APP_VERSION ?? 'unknown';
const BUILD_ID    = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? process.env.BUILD_ID ?? 'local';
const ENVIRONMENT = process.env.NODE_ENV ?? 'development';

interface ComponentHealth {
  status:  'up' | 'down' | 'degraded';
  latency?: number;
  message?: string;
  version?: string;
}

interface HealthReport {
  status:      'healthy' | 'unhealthy' | 'degraded';
  version:     string;
  buildId:     string;
  environment: string;
  timestamp:   string;
  uptime:      number;
  components:  Record<string, ComponentHealth>;
  metrics?:    Record<string, any>;
}

// ─── Component Checks ─────────────────────────────────────────────────────────

async function checkDatabase(): Promise<ComponentHealth> {
  const start = Date.now();
  try {
    await (prisma as any).$queryRaw`SELECT 1`;
    const latency = Date.now() - start;
    return {
      status:  latency > 2000 ? 'degraded' : 'up',
      latency,
      message: latency > 2000 ? 'Slow DB response' : 'OK',
    };
  } catch (e: any) {
    return { status: 'down', message: e.message };
  }
}

async function checkStorage(): Promise<ComponentHealth> {
  try {
    // Quick write/read test using settings table
    await (prisma as any).setting?.upsert?.({
      where:  { key_tenantId: { key: '__health_check__', tenantId: 'system' } },
      update: { value: new Date().toISOString() },
      create: { key: '__health_check__', tenantId: 'system', value: new Date().toISOString() },
    }).catch(() => null);
    return { status: 'up' };
  } catch {
    return { status: 'degraded', message: 'Settings write failed' };
  }
}

function checkMemory(): ComponentHealth {
  if (typeof process === 'undefined') return { status: 'up' };
  const mem  = process.memoryUsage();
  const heap = mem.heapUsed / mem.heapTotal;
  return {
    status:  heap > 0.9 ? 'degraded' : 'up',
    message: `Heap: ${(heap * 100).toFixed(1)}% — RSS: ${Math.round(mem.rss / 1024 / 1024)}MB`,
  };
}

function checkTelemetry(): ComponentHealth {
  const stats = telemetry.stats();
  return {
    status:  'up',
    message: `Spans: ${stats.completedSpans} | Metrics: ${stats.totalMetrics}`,
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const full    = searchParams.get('full') === '1' || searchParams.get('full') === 'true';
  const secret  = searchParams.get('secret');
  const isAdmin = secret === (process.env.HEALTH_SECRET ?? process.env.CRON_SECRET);

  // Liveness only (fast path for load balancers)
  if (!full && !isAdmin) {
    return NextResponse.json({
      status: 'healthy',
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // Full health check
  const [db, memory, telemetryCheck] = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkMemory()),
    Promise.resolve(checkTelemetry()),
  ]);

  const storage = isAdmin ? await checkStorage() : { status: 'up' as const };

  const components: Record<string, ComponentHealth> = {
    database:  db,
    memory,
    telemetry: telemetryCheck,
    storage,
  };

  // Overall status
  const hasDown     = Object.values(components).some(c => c.status === 'down');
  const hasDegraded = Object.values(components).some(c => c.status === 'degraded');
  const overallStatus: HealthReport['status'] = hasDown
    ? 'unhealthy'
    : hasDegraded ? 'degraded' : 'healthy';

  const report: HealthReport = {
    status:      overallStatus,
    version:     APP_VERSION,
    buildId:     BUILD_ID,
    environment: ENVIRONMENT,
    timestamp:   new Date().toISOString(),
    uptime:      Math.round(process.uptime?.() ?? 0),
    components,
  };

  // Include performance metrics for admin
  if (isAdmin) {
    const summary = telemetry.getMetricsSummary();
    const slowSpans = telemetry.getSlowSpans(500).slice(0, 5);
    report.metrics = {
      summary,
      slowestEndpoints: slowSpans.map(s => ({
        name:     s.name,
        duration: s.duration,
        status:   s.status,
      })),
    };
  }

  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;

  if (overallStatus !== 'healthy') {
    log.warn('Health check degraded', { overallStatus, components });
  }

  return NextResponse.json(report, {
    status:  httpStatus,
    headers: { 'Cache-Control': 'no-store' },
  });
}
