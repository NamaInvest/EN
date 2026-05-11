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

// ── Public Routes (no auth required) ──────────────────────────────────────────
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
  '/api/webhooks/events', // read-only events catalog
  '/api/public',
  '/api/pos/session/open',
  '/api/docs',
  '/api/metrics',        // Prometheus scraper (secured by network, not JWT)
  '/api/tenant/provision',     // handles its own auth (Clerk userId or clerkEmail)
  '/api/tenant/check-status',  // read-only — checks if user has provisioned tenant
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

  // ── 1. API Versioning Rewrite (/api/v1/* → /api/*) ──────────────────────────
  if (pathname.startsWith('/api/v1/')) {
    const newUrl = new URL(request.url);
    newUrl.pathname = pathname.replace('/api/v1/', '/api/');
    return NextResponse.rewrite(newUrl);
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
    return NextResponse.next();
  }

  // ── 4. Public routes ──────────────────────────────────────────────────────────
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // ── 5 + 6. Authenticate: API Key or JWT ─────────────────────────────────────
  const authHeader = request.headers.get('authorization');
  const rawToken   = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const cookieToken = request.cookies.get('token')?.value;

  // ── 5. API Key (Bearer nma_xxxx) ─────────────────────────────────────────────
  if (rawToken && API_KEY_PATTERN.test(rawToken)) {
    // The actual SHA-256 DB lookup happens in withRoute/api-key-auth.
    // Middleware just confirms format and forwards the key for downstream verification.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-api-key', rawToken);
    requestHeaders.set('x-auth-type', 'api-key');
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
    const requestHeaders = new Headers(request.headers);

    requestHeaders.set('x-user-id',   String(payload.userId   ?? ''));
    requestHeaders.set('x-user-role', String(payload.role     ?? ''));
    requestHeaders.set('x-tenant-id', String(payload.tenantId ?? ''));
    requestHeaders.set('x-username',  String(payload.username ?? ''));
    requestHeaders.set('x-auth-type', 'jwt');

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    return json401('Invalid or expired token');
  }
}

// Run on all API routes (pages are public by default)
export const config = {
  matcher: ['/api/:path*'],
};
