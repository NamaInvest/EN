/**
 * withRoute — Unified API Route Higher-Order Function
 * ════════════════════════════════════════════════════
 *
 * يُغلّف كل API route بـ:
 * 1. Authentication (JWT verification + user extraction)
 * 2. Rate limiting (Redis-based per tenant/IP)
 * 3. Tenant isolation (via AsyncLocalStorage)
 * 4. Error handling (structured JSON errors)
 * 5. Prisma injection (tenant-aware client)
 *
 * Usage:
 *   export const GET = withRoute(async ({ req, prisma, auth }) => {
 *     const items = await prisma.product.findMany();
 *     return NextResponse.json(items);
 *   }, { rateLimit: 'DEFAULT' });
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, resolveTenant, currentRequestStore } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// ── Types ──────────────────────────────────────────────────────────────────

export interface RouteAuth {
  userId:   number;
  role:     string;
  tenantId: string;
  username: string;
}

export interface RouteContext {
  req:    NextRequest;
  prisma: ReturnType<typeof getPrisma>;
  auth:   RouteAuth;
  tenant: string;
}

export type RouteHandler = (ctx: RouteContext, context?: any) => Promise<Response | NextResponse>;

export type RateLimitTier =
  | 'DEFAULT'    // 100 req/min
  | 'FINANCIAL'  // 30 req/min (mutations on financial data)
  | 'AI'         // 10 req/min (Gemini/LLM calls)
  | 'AUTH'       // 5 req/min (login attempts)
  | 'ADMIN'      // 20 req/min
  | 'UPLOAD'     // 10 req/min
  | 'CRON'       // Internal only
  | 'PUBLIC';    // 200 req/min (no auth required)

export interface WithRouteOptions {
  rateLimit?:   RateLimitTier;
  requireAuth?: boolean;     // default: true
  roles?:       string[];    // restrict to specific roles
}

// ── Rate limit configs ─────────────────────────────────────────────────────

const RATE_LIMITS: Record<RateLimitTier, { max: number; windowMs: number }> = {
  DEFAULT:   { max: 100,  windowMs: 60_000 },
  FINANCIAL: { max: 30,   windowMs: 60_000 },
  AI:        { max: 10,   windowMs: 60_000 },
  AUTH:      { max: 5,    windowMs: 60_000 },
  ADMIN:     { max: 20,   windowMs: 60_000 },
  UPLOAD:    { max: 10,   windowMs: 60_000 },
  CRON:      { max: 1000, windowMs: 60_000 },
  PUBLIC:    { max: 200,  windowMs: 60_000 },
};

// In-memory rate limiter (Redis integration placeholder)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, tier: RateLimitTier): boolean {
  const config = RATE_LIMITS[tier];
  const now    = Date.now();
  const entry  = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return true; // allowed
  }

  entry.count++;
  if (entry.count > config.max) return false; // blocked
  return true;
}

// ── Main HOF ───────────────────────────────────────────────────────────────

export function withRoute(handler: RouteHandler, options: WithRouteOptions = {}) {
  const { rateLimit = 'DEFAULT', requireAuth = true, roles } = options;

  return async function routeWrapper(req: NextRequest, context?: any): Promise<Response> {
    try {
      // 1. Resolve tenant (pass headers wrapper to satisfy resolveTenant signature)
      const reqForTenant = { headers: { get: (k: string) => req.headers.get(k) } };
      const tenant = resolveTenant(reqForTenant);

      // 2. Rate limiting
      const rateLimitKey = `${tenant}:${req.method}:${new URL(req.url).pathname}`;
      if (!checkRateLimit(rateLimitKey, rateLimit)) {
        return NextResponse.json(
          { error: 'Too Many Requests', retryAfter: 60 },
          { status: 429, headers: { 'Retry-After': '60' } }
        );
      }

      // 3. Authentication
      let auth: RouteAuth;

      if (requireAuth) {
        const user = getUserFromRequest(req as any);
        if (!user) {
          return NextResponse.json(
            { error: 'Unauthorized', message: 'يجب تسجيل الدخول أولاً' },
            { status: 401 }
          );
        }

        // 4. Role check (optional)
        if (roles && roles.length > 0 && !roles.includes(user.role)) {
          return NextResponse.json(
            { error: 'Forbidden', message: 'صلاحيات غير كافية' },
            { status: 403 }
          );
        }

        const u = user as any;
        auth = {
          userId:   u.userId ?? u.id ?? 0,
          role:     u.role ?? 'user',
          tenantId: tenant,
          username: u.username ?? u.email ?? '',
        };
      } else {
        // Public route — minimal auth object
        auth = {
          userId:   0,
          role:     'guest',
          tenantId: tenant,
          username: 'anonymous',
        };
      }

      // 5. Get tenant-aware Prisma client
      const prisma = getPrisma(req as any);

      // 6. Run handler within tenant context
      return await currentRequestStore.run(tenant, () =>
        handler({ req, prisma: prisma as any, auth, tenant }, context)
      );

    } catch (err: any) {
      // Structured error response
      const isDev = process.env.NODE_ENV === 'development';
      console.error(`[withRoute] ${req.method} ${req.url}:`, err);

      return NextResponse.json(
        {
          error:   'Internal Server Error',
          message: isDev ? err.message : 'حدث خطأ في المعالجة',
          ...(isDev && { stack: err.stack }),
        },
        { status: 500 }
      );
    }
  };
}

export default withRoute;
