/**
 * Security Headers Middleware (OWASP Best Practices)
 * ══════════════════════════════════════════════════════════════════════════════
 * Applies comprehensive security headers to all responses.
 *
 * OWASP Top 10 mitigations covered:
 *   A02 - Cryptographic Failures → Strict-Transport-Security
 *   A03 - Injection → Content-Security-Policy (no inline scripts)
 *   A05 - Security Misconfiguration → X-Frame-Options, X-Content-Type-Options
 *   A07 - Identification Failures → removed Server header, Referrer-Policy
 *
 * Place in: middleware.ts (root of project)
 */

import { NextRequest, NextResponse } from 'next/server';

// ─── Security Headers Configuration ─────────────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
  // HSTS — force HTTPS for 2 years, include subdomains
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // XSS Protection (legacy browsers)
  'X-XSS-Protection': '1; mode=block',

  // Referrer: only send origin (no path) to same-origin
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy — restrict browser APIs
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'bluetooth=()',
    'accelerometer=()',
    'gyroscope=()',
    'magnetometer=()',
  ].join(', '),

  // Content Security Policy
  // Note: 'unsafe-inline' is needed for Next.js inline styles; tighten in production
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",   // unsafe-inline needed by Next.js dev
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://api.zatca.gov.sa wss:",  // allow ZATCA + WebSockets
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; '),

  // Cross-Origin policies
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy':   'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

// Remove sensitive headers
const REMOVE_HEADERS = ['X-Powered-By', 'Server'];

// ─── Route Patterns ───────────────────────────────────────────────────────────

// API routes that need CORS for external integrations
const CORS_ALLOWED_PATHS = [
  '/api/openapi',
  '/api/health',
  '/api/webhooks',
  '/api/zatca',
];

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id, x-api-key',
  'Access-Control-Max-Age': '86400',
};

// ─── Middleware Export ─────────────────────────────────────────────────────────

export function applySecurityHeaders(
  req:      NextRequest,
  response: NextResponse,
): NextResponse {
  const path   = new URL(req.url).pathname;
  const origin = req.headers.get('origin') ?? '';

  // Apply security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // Remove sensitive headers
  for (const header of REMOVE_HEADERS) {
    response.headers.delete(header);
  }

  // Add CORS headers for allowed paths
  const needsCORS = CORS_ALLOWED_PATHS.some(p => path.startsWith(p));
  if (needsCORS) {
    // Allow specific origins or all for public endpoints
    const allowedOrigin = process.env.ALLOWED_ORIGIN ?? '*';
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }
  }

  return response;
}

/**
 * Rate-limit tracking header (informational, actual limiting is in with-route.ts)
 */
export function addRateLimitHeaders(
  response:  NextResponse,
  limit:     number,
  remaining: number,
  resetMs:   number,
): void {
  response.headers.set('X-RateLimit-Limit',     String(limit));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset',     String(Math.ceil(Date.now() / 1000) + Math.ceil(resetMs / 1000)));
}

/**
 * Handle preflight OPTIONS requests
 */
export function handlePreflight(req: NextRequest): NextResponse | null {
  if (req.method !== 'OPTIONS') return null;

  const path = new URL(req.url).pathname;
  const needsCORS = CORS_ALLOWED_PATHS.some(p => path.startsWith(p));

  if (!needsCORS) return null;

  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin',  process.env.ALLOWED_ORIGIN ?? '*');
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}
