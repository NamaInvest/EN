/**
 * Next.js Edge Middleware — Centralized Auth Guard
 *
 * Protects all /api/* routes except explicitly listed public ones.
 * Runs on Edge Runtime (before any route handler).
 *
 * Auth flow:
 *   1. Check for cron routes → validate x-cron-secret header
 *   2. Check Authorization header for Bearer token
 *   3. Check `token` cookie as fallback
 *   4. Verify JWT signature
 *   5. If invalid → 401 Unauthorized
 *   6. If valid → inject x-user-id, x-tenant-id headers → allow
 *
 * Reference: IMPROVEMENT_PLAN/KICKOFF.md — اليوم الثالث
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// ─── Public Routes (no auth required) ──────────────────────────
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/mfa/verify',
  '/api/health',
  '/api/sys/health',
  '/api/b2b/auth/login',
  '/api/b2b/auth/register',
  '/api/zatca/callback',
  '/api/webhook',
  '/api/webhooks',
  '/api/public',
  '/api/pos/session/open',    // POS initial login
  '/api/docs',                // OpenAPI documentation
];

// ─── Permanently Disabled Routes (HTTP 410 Gone) ───────────────
const DISABLED_ROUTES = [
  '/api/system/reset',
  '/api/check-env',
];

// ─── Cron Routes (require x-cron-secret) ───────────────────────
const CRON_ROUTES_PATTERN = /^\/api\/cron\//;

// Routes outside /api/ that are always public (pages, assets)
const ALWAYS_PUBLIC_PREFIXES = [
  '/_next/',
  '/favicon',
  '/robots',
  '/sitemap',
];

function isPublicRoute(pathname: string): boolean {
  // Non-API routes are always public (handled by page-level auth)
  if (!pathname.startsWith('/api/')) return true;

  // Static assets
  if (ALWAYS_PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) return true;

  // Exact public API routes (prefix match)
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) return true;

  return false;
}

function isDisabledRoute(pathname: string): boolean {
  return DISABLED_ROUTES.some(route => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── API Versioning Rewrite (Phase 9.2) ─────────────────────────
  // Allow external API consumers to use /api/v1/* while routing to internal /api/*
  if (pathname.startsWith('/api/v1/')) {
      const newUrl = new URL(request.url);
      newUrl.pathname = pathname.replace('/api/v1/', '/api/');
      return NextResponse.rewrite(newUrl);
  }

  // ─── Disabled routes: always return 410 Gone ──────────────────
  if (isDisabledRoute(pathname)) {
    return new NextResponse(
      JSON.stringify({ error: 'DISABLED', message: 'This endpoint has been permanently removed.' }),
      { status: 410, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ─── Cron routes: validate shared secret ──────────────────────
  if (CRON_ROUTES_PATTERN.test(pathname)) {
    const cronSecret = request.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret || cronSecret !== expectedSecret) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized', message: 'Invalid cron secret' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    // Cron authenticated → allow through
    return NextResponse.next();
  }

  // ─── Public routes: pass through ──────────────────────────────
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // ─── JWT Authentication ───────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  let token: string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    token = request.cookies.get('token')?.value;
  }

  if (!token) {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Verify JWT
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('CRITICAL: JWT_SECRET not set in environment');
    return new NextResponse(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    // Forward user context to route handlers via headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', String(payload.userId ?? ''));
    requestHeaders.set('x-user-role', String(payload.role ?? ''));
    requestHeaders.set('x-tenant-id', String(payload.tenantId ?? ''));
    requestHeaders.set('x-username', String(payload.username ?? ''));

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized', message: 'Invalid or expired token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Only run middleware on API routes to avoid overhead on pages
export const config = {
  matcher: [
    '/api/:path*',
  ],
};
