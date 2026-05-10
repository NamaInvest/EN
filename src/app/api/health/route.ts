/**
 * Health Check Endpoint
 * GET /api/health
 *
 * يُستخدمها:
 * - Load balancer (PM2 + Nginx) للـ health gate
 * - CI/CD rollback decision: curl -f /api/health
 * - Uptime monitoring (Better Uptime, UptimeRobot, etc.)
 *
 * ملاحظة: هذا route PUBLIC — لا يحتاج tenant DB
 * يستخدم DB الافتراضية فقط للـ connectivity check
 */
import { NextResponse } from 'next/server';
import os from 'os';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'health' });

const VERSION    = process.env.npm_package_version || '2.4.6';
const REQUIRED_ENVS = ['JWT_SECRET', 'DATABASE_URL'];
const START_TIME = Date.now();

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, 'ok' | 'warn' | 'error'> = { api: 'ok' };

  // ── Database Ping ──────────────────────────────────────────────────────────
  try {
    const { PrismaClient } = await import('@prisma/client');
    const dbUrl  = process.env.DATABASE_URL_DEFAULT || process.env.DATABASE_URL;
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  // ── Environment Secrets ────────────────────────────────────────────────────
  const missingEnvs        = REQUIRED_ENVS.filter(k => !process.env[k]);
  checks.environment       = missingEnvs.length === 0 ? 'ok' : 'error';

  // ── Memory ─────────────────────────────────────────────────────────────────
  const mem    = process.memoryUsage();
  const heapMb = Math.round(mem.heapUsed / 1024 / 1024);
  const rssMb  = Math.round(mem.rss      / 1024 / 1024);
  checks.memory = heapMb > 1500 ? 'warn' : 'ok';

  // ── ZATCA (optional, non-blocking) ─────────────────────────────────────────
  if (process.env.ZATCA_ENV) {
    try {
      const zatcaUrl = process.env.ZATCA_ENV === 'production'
        ? 'https://fatoora.zatca.gov.sa/developer-portal'
        : 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal';
      const res = await fetch(zatcaUrl, { method: 'HEAD', signal: AbortSignal.timeout(2000) });
      checks.zatca = res.ok ? 'ok' : 'warn';
    } catch {
      checks.zatca = 'warn'; // ZATCA down — don't mark app as 503
    }
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  const hasErrors = Object.values(checks).some(v => v === 'error');
  const latencyMs = Date.now() - startTime;

  const body: Record<string, unknown> = {
    status:    hasErrors ? 'degraded' : 'healthy',
    version:   VERSION,
    timestamp: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
    startedAt: new Date(Date.now() - (Date.now() - START_TIME)).toISOString(),
    latencyMs,
    memory:    { heapMb, rssMb },
    checks,
  };

  if (process.env.NODE_ENV !== 'production') {
    body.platform    = os.platform();
    body.nodeVersion = process.version;
    if (missingEnvs.length > 0) body.missingEnvs = missingEnvs;
  }

  return NextResponse.json(body, {
    status:  hasErrors ? 503 : 200,
    headers: { 'Cache-Control': 'no-store, no-cache' },
  });
}
