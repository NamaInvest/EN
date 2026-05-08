import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * GET /api/health
 *
 * Returns system health status for load balancers, PM2, and monitoring.
 * This route is explicitly PUBLIC (whitelisted in middleware.ts).
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

    // Check environment secrets
    const requiredEnvs = ['JWT_SECRET', 'ENCRYPTION_KEY', 'DATABASE_URL'];
    const missingEnvs = requiredEnvs.filter(k => !process.env[k]);
    checks.environment = missingEnvs.length === 0 ? 'ok' : 'error';

    const allOk = Object.values(checks).every(v => v === 'ok');
    const latency = Date.now() - startTime;

    return NextResponse.json(
        {
            status: allOk ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '2.4.6',
            latencyMs: latency,
            checks,
            ...(missingEnvs.length > 0 ? { missingEnvs } : {}),
        },
        {
            status: allOk ? 200 : 503,
            headers: { 'Cache-Control': 'no-store' },
        }
    );
}
