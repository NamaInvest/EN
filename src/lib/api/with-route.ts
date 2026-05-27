/**
 * Unified API Route Higher-Order Function.
 *
 * withRoute is the API boundary where request tenant, authenticated tenant,
 * rate limiting, route roles, Prisma, requestId, and metrics are bound together.
 */

import crypto from 'crypto';
import IORedis from 'ioredis';
import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, resolveTenantContext, currentRequestStore } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { assertTenantContextMatch, TENANT_ISOLATION_ERROR, TenantContextInfo } from '@/lib/governance/tenant-guard';
import { httpRequestsTotal, httpRequestDuration } from '@/lib/instrumentation/metrics';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'with-route' });

export interface RouteAuth {
  userId: number;
  role: string;
  tenantId: string;
  username: string;
}

export interface RouteContext {
  req: NextRequest;
  prisma: ReturnType<typeof getPrisma>;
  auth: RouteAuth;
  /** Backward-compatible tenant slug used by existing routes. */
  tenant: string;
  /** Canonical request tenant context, including route slug and row tenantId. */
  tenantContext: TenantContextInfo;
  requestId: string;
}

export type RouteHandler = (ctx: RouteContext, context?: any) => Promise<Response | NextResponse>;

export type RateLimitTier =
  | 'DEFAULT'
  | 'FINANCIAL'
  | 'AI'
  | 'AUTH'
  | 'ADMIN'
  | 'UPLOAD'
  | 'CRON'
  | 'PUBLIC';

export interface WithRouteOptions {
  rateLimit?: RateLimitTier;
  requireAuth?: boolean;
  roles?: string[];
  /**
   * Tenant-required routes reject missing tenant context instead of falling back
   * to environment/default tenant. Defaults to authenticated routes only.
   */
  tenantRequired?: boolean;
  /** Optional granular RBAC checking module (e.g. 'treasury', 'payroll') */
  module?: string;
  /** Optional override for granular permission action. Mapped by request method if omitted. */
  permission?: 'view' | 'add' | 'edit' | 'delete' | 'print';
}

const RATE_LIMITS: Record<RateLimitTier, { max: number; windowMs: number }> = {
  DEFAULT: { max: 100, windowMs: 60_000 },
  FINANCIAL: { max: 30, windowMs: 60_000 },
  AI: { max: 10, windowMs: 60_000 },
  AUTH: { max: 500, windowMs: 60_000 },
  ADMIN: { max: 20, windowMs: 60_000 },
  UPLOAD: { max: 10, windowMs: 60_000 },
  CRON: { max: 1000, windowMs: 60_000 },
  PUBLIC: { max: 200, windowMs: 60_000 },
};

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const redisRateLimiter = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  enableOfflineQueue: false,
});

redisRateLimiter.on('error', () => { /* memory fallback below handles Redis outages */ });

async function checkRateLimit(key: string, tier: RateLimitTier): Promise<boolean> {
  const config = RATE_LIMITS[tier];

  try {
    const redisKey = `ratelimit:${key}`;
    const count = await redisRateLimiter.incr(redisKey);
    if (count === 1) {
      await redisRateLimiter.pexpire(redisKey, config.windowMs);
    }
    return count <= config.max;
  } catch {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
      return true;
    }

    entry.count++;
    return entry.count <= config.max;
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt < now) rateLimitStore.delete(k);
    }
  }, 600_000).unref?.();
}

function requestHeader(req: NextRequest, name: string): string | null {
  return req.headers.get(name);
}

function errorStatus(err: unknown): number {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes(TENANT_ISOLATION_ERROR)) return 403;
  return 500;
}

export function withRoute(handler: RouteHandler, options: WithRouteOptions = {}) {
  const { rateLimit = 'DEFAULT', requireAuth = true, roles } = options;
  const tenantRequired = options.tenantRequired ?? requireAuth;

  return async function routeWrapper(req: NextRequest, context?: any): Promise<Response> {
    const startMs = Date.now();
    const method = req.method;
    const pathname = new URL(req.url).pathname;
    const requestId = crypto.randomUUID();

    try {
      const reqForTenant = { headers: { get: (k: string) => req.headers.get(k) } };
      const tenantContext = resolveTenantContext(reqForTenant, {
        requireTenant: tenantRequired,
        allowEnvFallback: !tenantRequired,
      });
      const tenant = tenantContext.tenantSlug;

      assertTenantContextMatch({
        routeTenant: tenantContext,
        headerTenant: requestHeader(req, 'x-tenant'),
        headerTenantId: requestHeader(req, 'x-tenant-id'),
        pathname,
      });

      const rateLimitKey = `${tenant}:${method}:${pathname}`;
      if (!(await checkRateLimit(rateLimitKey, rateLimit))) {
        httpRequestsTotal.inc({ method, status: '429', route: pathname });
        return NextResponse.json(
          { error: 'Too Many Requests', retryAfter: 60 },
          { status: 429, headers: { 'Retry-After': '60', 'X-Request-Id': requestId } }
        );
      }

      let auth: RouteAuth;

      if (requireAuth) {
        const user = getUserFromRequest(req as any);
        if (!user) {
          httpRequestsTotal.inc({ method, status: '401', route: pathname });
          return NextResponse.json(
            { error: 'Unauthorized', message: 'يجب تسجيل الدخول أولاً' },
            { status: 401, headers: { 'X-Request-Id': requestId } }
          );
        }

        assertTenantContextMatch({
          routeTenant: tenantContext,
          authTenantId: (user as any).tenantId,
          pathname,
        });

        if (roles && roles.length > 0 && !roles.includes((user as any).role)) {
          httpRequestsTotal.inc({ method, status: '403', route: pathname });
          return NextResponse.json(
            { error: 'Forbidden', message: 'صلاحيات غير كافية' },
            { status: 403, headers: { 'X-Request-Id': requestId } }
          );
        }

        const u = user as any;
        auth = {
          userId: u.userId ?? u.id ?? 0,
          role: u.role ?? 'user',
          tenantId: tenant,
          username: u.username ?? u.email ?? '',
        };
      } else {
        auth = { userId: 0, role: 'guest', tenantId: tenant, username: 'anonymous' };
      }

      const response = await currentRequestStore.run(tenant, async () => {
        const prisma = getPrisma(req as any, { requireTenant: tenantRequired });

        // Centrally enforce granular RBAC if 'module' is specified
        if (requireAuth && options.module) {
          const dbUser = await prisma.user.findUnique({
            where: { id: auth.userId },
            select: { id: true, role: true, permissions: true },
          });

          if (!dbUser) {
            httpRequestsTotal.inc({ method, status: '401', route: pathname });
            return NextResponse.json(
              { error: 'Unauthorized', message: 'المستخدم غير موجود' },
              { status: 401, headers: { 'X-Request-Id': requestId } }
            );
          }

          // Admin and Owner roles bypass module-level permission checks
          if (dbUser.role !== 'admin' && dbUser.role !== 'owner') {
            const userPerm = dbUser.permissions.find((p: any) => p.module === options.module);
            if (!userPerm) {
              httpRequestsTotal.inc({ method, status: '403', route: pathname });
              return NextResponse.json(
                { error: 'Forbidden', message: 'صلاحيات غير كافية للوصول إلى هذا القسم' },
                { status: 403, headers: { 'X-Request-Id': requestId } }
              );
            }

            const action = options.permission || 
              (method === 'GET' ? 'view' : 
               method === 'POST' ? 'add' : 
               method === 'DELETE' ? 'delete' : 'edit');

            let isAllowed = false;
            if (action === 'view' && userPerm.canView) isAllowed = true;
            else if (action === 'add' && userPerm.canAdd) isAllowed = true;
            else if (action === 'edit' && userPerm.canEdit) isAllowed = true;
            else if (action === 'delete' && userPerm.canDelete) isAllowed = true;
            else if (action === 'print' && userPerm.canPrint) isAllowed = true;

            if (!isAllowed) {
              httpRequestsTotal.inc({ method, status: '403', route: pathname });
              return NextResponse.json(
                { error: 'Forbidden', message: 'صلاحيات غير كافية لإجراء هذه العملية' },
                { status: 403, headers: { 'X-Request-Id': requestId } }
              );
            }
          }
        }

        return handler({ req, prisma: prisma as any, auth, tenant, tenantContext, requestId }, context);
      });

      const durationSec = (Date.now() - startMs) / 1000;
      const status = String((response as any).status ?? 200);
      httpRequestsTotal.inc({ method, status, route: pathname });
      httpRequestDuration.observe({ method, route: pathname }, durationSec);

      const headers = new Headers((response as Response).headers);
      headers.set('X-Request-Id', requestId);
      headers.set('X-Response-Time', `${Date.now() - startMs}ms`);

      return new Response((response as Response).body, {
        status: (response as Response).status,
        headers,
      });
    } catch (err: any) {
      const durationSec = (Date.now() - startMs) / 1000;
      const status = errorStatus(err);
      httpRequestsTotal.inc({ method, status: String(status), route: pathname });
      httpRequestDuration.observe({ method, route: pathname }, durationSec);

      const isDev = process.env.NODE_ENV === 'development';
      log.error(`[withRoute] ${method} ${pathname} [${requestId}]:`, err.message);

      return NextResponse.json(
        {
          error: status === 403 ? TENANT_ISOLATION_ERROR : 'Internal Server Error',
          message: isDev ? err.message : status === 403 ? 'Tenant isolation violation' : 'حدث خطأ في المعالجة',
          requestId,
          ...(isDev && { stack: err.stack }),
        },
        { status, headers: { 'X-Request-Id': requestId } }
      );
    }
  };
}

export default withRoute;
