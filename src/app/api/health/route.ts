import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * GET /api/health
 *
 * Returns system health status for load balancers, PM2, and monitoring.
 * This route is explicitly PUBLIC (whitelisted in middleware.ts).
 *
 * Security: Does NOT expose sensitive environment details in production.
 */
export async function GET() {
    const startTime = Date.now();

    const checks: Record<string, 'ok' | 'error' | 'warn'> = {
        api: 'ok',
    };

    // Check DB connectivity
    try {
        const { getPrisma } = await import('@/lib/prisma');
        const prisma = getPrisma();
        // Simple ping — fast, no data read
        await (prisma as any).$queryRaw`SELECT 1`;
        checks.database = 'ok';
    } catch {
        checks.database = 'error';
    }

    // Check critical environment secrets (names only, never values)
    const requiredEnvs = ['JWT_SECRET', 'ENCRYPTION_KEY', 'DATABASE_URL'];
    const missingEnvs = requiredEnvs.filter(k => !process.env[k]);
    checks.environment = missingEnvs.length === 0 ? 'ok' : 'error';

    // Check Redis connectivity
    try {
        const { redisConnection } = await import('@/lib/queue');
        if (redisConnection && redisConnection.status === 'ready') {
            checks.redis = 'ok';
        } else {
            const ping = await redisConnection.ping();
            checks.redis = ping === 'PONG' ? 'ok' : 'error';
        }
    } catch {
        checks.redis = 'error';
    }

    // Check ZATCA simulation ping (optional, just to see if network egress works)
    if (process.env.ZATCA_ENV) {
        try {
            const zatcaUrl = process.env.ZATCA_ENV === 'production' 
              ? 'https://fatoora.zatca.gov.sa/developer-portal'
              : 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal';
            
            const res = await fetch(zatcaUrl, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
            checks.zatca = res.ok ? 'ok' : 'warn';
        } catch {
            checks.zatca = 'warn'; // Just warn because ZATCA could be down, shouldn't mark app as 503
        }
    }

    // Memory usage
    const mem = process.memoryUsage();
    const memoryMb = Math.round(mem.heapUsed / 1024 / 1024);
    checks.memory = memoryMb > 1024 ? 'warn' : 'ok';

    const allOk = Object.values(checks).every(v => v === 'ok');
    const latency = Date.now() - startTime;

    const response: Record<string, unknown> = {
        status: allOk ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '2.4.6',
        uptime: Math.round(process.uptime()),
        latencyMs: latency,
        memoryMb,
        checks,
    };

    // Only expose missing env names in development (never in production)
    if (process.env.NODE_ENV === 'development' && missingEnvs.length > 0) {
        response.missingEnvs = missingEnvs;
    }

    return NextResponse.json(response, {
        status: allOk ? 200 : 503,
        headers: { 'Cache-Control': 'no-store' },
    });
}
