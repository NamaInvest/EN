/**
 * Next.js Edge Middleware — Centralized Auth Guard (v3)
 * ════════════════════════════════════════════════════════
 *
 * Auth flow (in order):
 *  1. API Versioning rewrite  /api/v1/* → /api/*
 *  2. Disabled routes         → 410 Gone
 *  3. Cron routes             → validate x-cron-secret
 *  4. Public routes           → pass through
 *  5. API Key auth            → Bearer nma_xxx (SHA-256 verified in withRoute)
 *  6. JWT auth                → Bearer <jwt> or cookie
 *  7. Unknown                 → 401 Unauthorized
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { rateLimit } from '@/lib/rate-limit';

// ── Rate Limiting Configurations ─────────────────────────────────────────────
const LIMITS = {
  AUTH: { max: 5, windowMs: 60_000 },       // Sensitive auth endpoints: 5 req/min
  MUTATION: { max: 30, windowMs: 60_000 },  // Write operations: 30 req/min
  GET: { max: 120, windowMs: 60_000 },      // Read operations: 120 req/min
};

function isSensitiveAuthRoute(pathname: string): boolean {
  const SENSITIVE_ROUTES = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/mfa/verify',
    '/api/pos/session/open',
  ];
  return SENSITIVE_ROUTES.some(r => pathname === r);
}

function buildRateLimitResponse(max: number, resetAt: number): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return new NextResponse(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'تجاوزت الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(max),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(resetAt),
      },
    }
  );
}

// ── Public Routes (no auth required) ──────────────────────────────────────────
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/mfa/verify',
  '/api/auth/sso-redirect',        // Clerk SSO flow — no JWT needed
  '/api/auth/sso',                 // Clerk SSO handler
  '/api/auth/auto-login',          // token-based auto-login after provisioning
  '/api/auth/find-tenant-by-email',// used during onboarding lookup
  '/api/auth/login-by-email',      // email-based login (no JWT yet)
  '/api/auth/sync',                // Clerk → local user sync
  '/api/health',
  '/api/sys/health',
  '/api/b2b/auth/login',
  '/api/b2b/auth/register',
  '/api/zatca/callback',
  '/api/webhook',
  '/api/webhooks/events',
  '/api/public',
  '/api/pos/session/open',
  '/api/docs',
  '/api/metrics',
  '/api/master-panel/auth',        // master login handles its own credential check
  '/api/master-panel-data',        // guarded internally by master_token/owner token
  '/api/master-panel/servers',     // guarded internally by master_token/owner token
  '/api/master-panel/licenses',    // guarded internally by master_token/owner token
  '/api/tenant/provision',         // handles its own auth (Clerk userId or clerkEmail)
  '/api/tenant/check-status',      // read-only — checks if user has provisioned tenant
  '/api/tenant/status',            // legacy read-only tenant status lookup used by auth routing
  '/api/translate',                // Public translation endpoint for onboarding
  '/api/ice/auth/login',           // ICE admin login
  '/api/ice/auth/2fa/verify',      // ICE admin 2FA verification
];

// ── Permanently Disabled Routes (HTTP 410 Gone) ───────────────────────────────
const DISABLED_ROUTES = [
  '/api/system/reset',
  '/api/check-env',
];

// ── Cron Routes (require x-cron-secret) ──────────────────────────────────────
const CRON_ROUTES_PATTERN = /^\/api\/cron\//;

// ── API Key prefix (nma_ + 40 hex chars) ─────────────────────────────────────
const API_KEY_PATTERN = /^nma_[0-9a-f]{40}$/;

function isPublicRoute(pathname: string): boolean {
  if (!pathname.startsWith('/api/')) return true;
  if (PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) return true;
  return false;
}

function isDisabledRoute(pathname: string): boolean {
  return DISABLED_ROUTES.some(r => pathname.startsWith(r));
}

function json401(message: string) {
  return new NextResponse(
    JSON.stringify({ error: 'Unauthorized', message }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);

  // ── 0. Subdomain Tenant Resolution (Law 1) ───────────────────────────────────
  const host = request.headers.get('host') || '';
  let subdomain = 'default';
  if (host.includes('.namainvist.com')) {
    subdomain = host.split('.namainvist.com')[0];
  } else if (host.includes('localhost')) {
    const parts = host.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost') {
      subdomain = parts[0];
    }
  }
  requestHeaders.set('x-tenant-subdomain', subdomain);

  // ── 1. API Versioning Rewrite (/api/v1/* → /api/*) ──────────────────────────
  if (pathname.startsWith('/api/v1/')) {
    const newUrl = new URL(request.url);
    newUrl.pathname = pathname.replace('/api/v1/', '/api/');
    return NextResponse.rewrite(newUrl, { request: { headers: requestHeaders } });
  }

  // ── 1.5 ICE Super Admin Panel Guard ──────────────────────────────────────────
  if (pathname.startsWith('/ice') && !pathname.startsWith('/ice/login')) {
    const iceSession = request.cookies.get('ice_session')?.value;
    if (!iceSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/ice/login';
      return NextResponse.redirect(url);
    }
    try {
      const jwtSecret = process.env.JWT_SECRET || 'fallback_super_secret_ice_key_2026';
      const secret = new TextEncoder().encode(jwtSecret);
      await jwtVerify(iceSession, secret);
    } catch {
      const url = request.nextUrl.clone();
      url.pathname = '/ice/login';
      return NextResponse.redirect(url);
    }
  }


  // ── 2. Disabled routes ────────────────────────────────────────────────────────
  if (isDisabledRoute(pathname)) {
    return new NextResponse(
      JSON.stringify({ error: 'DISABLED', message: 'This endpoint has been permanently removed.' }),
      { status: 410, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── 3. Cron routes ─────────────────────────────────────────────────────────────
  if (CRON_ROUTES_PATTERN.test(pathname)) {
    const cronSecret   = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;
    if (!expectedSecret || cronSecret !== expectedSecret) {
      return json401('Invalid cron secret');
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── 4. Public routes ──────────────────────────────────────────────────────────
  if (isPublicRoute(pathname)) {
    // Run rate limiting using client IP for public/anonymous endpoints
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
    const limitConfig = isSensitiveAuthRoute(pathname) && request.method !== 'GET' ? LIMITS.AUTH : request.method === 'GET' ? LIMITS.GET : LIMITS.MUTATION;
    const rateLimitKey = isSensitiveAuthRoute(pathname) && request.method !== 'GET' ? 'auth' : request.method;

    const result = await rateLimit(request, {
      max: limitConfig.max,
      windowMs: limitConfig.windowMs,
      keyFn: () => `mw:${rateLimitKey}:ip:${ip}`
    });

    if (!result.allowed) {
      return buildRateLimitResponse(limitConfig.max, result.resetAt);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── 5 + 6. Authenticate: API Key or JWT ─────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  const rawToken   = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const cookieToken = request.cookies.get('token')?.value;

  // ── 5. API Key (Bearer nma_xxxx) ─────────────────────────────────────────────
  if (rawToken && API_KEY_PATTERN.test(rawToken)) {
    // The actual SHA-256 DB lookup happens in withRoute/api-key-auth.
    // Middleware just confirms format and forwards the key for downstream verification.
    // The global requestHeaders is already created
    requestHeaders.set('x-api-key', rawToken);
    requestHeaders.set('x-auth-type', 'api-key');

    // Run rate limiting using API Key
    const limitConfig = request.method === 'GET' ? LIMITS.GET : LIMITS.MUTATION;
    const result = await rateLimit(request, {
      max: limitConfig.max,
      windowMs: limitConfig.windowMs,
      keyFn: () => `mw:${request.method}:apikey:${rawToken.slice(0, 10)}` // slice to prevent logging full key
    });

    if (!result.allowed) {
      return buildRateLimitResponse(limitConfig.max, result.resetAt);
    }

    // tenantId will be resolved from the DB record in the route handler.
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── 6. JWT (Bearer <jwt> or cookie) ──────────────────────────────────────────
  const token = rawToken ?? cookieToken;
  if (!token) return json401('Authentication required');

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('CRITICAL: JWT_SECRET not set in environment');
    return new NextResponse(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const secret        = new TextEncoder().encode(jwtSecret);
    const { payload }   = await jwtVerify(token, secret);
    // The global requestHeaders is already created

    requestHeaders.set('x-user-id',   String(payload.userId   ?? ''));
    requestHeaders.set('x-user-role', String(payload.role     ?? ''));
    requestHeaders.set('x-tenant-id', String(payload.tenantId ?? ''));
    requestHeaders.set('x-username',  String(payload.username ?? ''));
    requestHeaders.set('x-auth-type', 'jwt');

    // Run rate limiting using authenticated user ID
    const userId = String(payload.userId ?? '');
    const limitConfig = request.method === 'GET' ? LIMITS.GET : LIMITS.MUTATION;
    const result = await rateLimit(request, {
      max: limitConfig.max,
      windowMs: limitConfig.windowMs,
      keyFn: () => `mw:${request.method}:user:${userId}`
    });

    if (!result.allowed) {
      return buildRateLimitResponse(limitConfig.max, result.resetAt);
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    return json401('Invalid or expired token');
  }
}

// Run on all routes except static files to resolve subdomains globally
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

