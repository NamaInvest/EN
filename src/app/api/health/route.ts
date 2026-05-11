import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Redis } from '@upstash/redis';

// Note: Replace with actual Upstash Redis if configured, or fail gracefully
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

interface HealthCheck {
  name: string;
  status: HealthStatus;
  latency: number | null;
  error: string | null;
}

const HEALTH_CHECK_NAMES = [
  'database',
  'redis',
  'zatca',
];

export async function GET() {
  const checks: HealthCheck[] = await Promise.allSettled([
    checkDatabase(),
    checkRedis(),
    checkZATCA(),
  ]).then(results => results.map((r, i) => {
    if (r.status === 'fulfilled') {
      return {
        name: HEALTH_CHECK_NAMES[i],
        status: r.value.status,
        latency: r.value.latency,
        error: null,
      };
    } else {
      return {
        name: HEALTH_CHECK_NAMES[i],
        status: 'unhealthy',
        latency: null,
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      };
    }
  }));

  const overall = checks.every(c => c.status === 'healthy') ? 'healthy' :
                  checks.some(c => c.status === 'unhealthy') ? 'unhealthy' : 'degraded';

  return NextResponse.json({
    status: overall,
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    checks,
  }, {
    status: overall === 'healthy' ? 200 : overall === 'degraded' ? 200 : 503,
  });
}

async function checkDatabase(): Promise<{ status: HealthStatus, latency: number }> {
  const start = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', latency: Math.round(performance.now() - start) };
  } catch (err) {
    throw new Error('Database connection failed');
  }
}

async function checkRedis(): Promise<{ status: HealthStatus, latency: number }> {
  if (!redis) {
    return { status: 'degraded', latency: 0 }; // Soft-fail if redis not configured
  }
  const start = performance.now();
  try {
    await redis.ping();
    return { status: 'healthy', latency: Math.round(performance.now() - start) };
  } catch (err) {
    throw new Error('Redis connection failed');
  }
}

async function checkZATCA(): Promise<{ status: HealthStatus, latency: number }> {
  const zatcaUrl = process.env.ZATCA_BASE_URL;
  if (!zatcaUrl) {
    return { status: 'degraded', latency: 0 }; // Not critical for general ERP health if not configured
  }
  const start = performance.now();
  try {
    const response = await fetch(`${zatcaUrl}`, { // Root or health endpoint
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    return {
      status: response.ok ? 'healthy' : 'degraded',
      latency: Math.round(performance.now() - start),
    };
  } catch (err) {
    return { status: 'degraded', latency: Math.round(performance.now() - start) }; // ZATCA API might be down, shouldn't crash ERP
  }
}
