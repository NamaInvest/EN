/**
 * API Versioning Middleware — P2.6
 * ─────────────────────────────────────────────────────────────────────────────
 * Supports versioning via:
 *   1. URL prefix:   /api/v1/sales
 *   2. Header:       API-Version: 1
 *   3. Accept:       application/vnd.namasoft.v1+json
 *
 * Current versions:
 *   v1 → current (stable)
 *   v2 → upcoming (not yet available)
 *
 * Added to middleware.ts to intercept /api/v1/* requests
 */

import { NextRequest, NextResponse } from 'next/server';

const CURRENT_VERSION = 1;
const SUPPORTED_VERSIONS = [1];
const DEPRECATION_NOTICE: Record<number, string | undefined> = {
  // 1: 'v1 will be deprecated on 2027-01-01',
};

export interface VersionInfo {
  version: number;
  isLatest: boolean;
  deprecationNotice?: string;
}

// ── Extract requested version ─────────────────────────────────────────────────

export function extractApiVersion(req: NextRequest): number {
  // 1. URL prefix: /api/v1/...
  const urlMatch = req.nextUrl.pathname.match(/\/api\/v(\d+)\//);
  if (urlMatch) return parseInt(urlMatch[1]);

  // 2. Header: API-Version: 1
  const headerVersion = req.headers.get('API-Version');
  if (headerVersion) return parseInt(headerVersion);

  // 3. Accept header: application/vnd.namasoft.v1+json
  const accept = req.headers.get('Accept') ?? '';
  const acceptMatch = accept.match(/vnd\.namasoft\.v(\d+)\+json/);
  if (acceptMatch) return parseInt(acceptMatch[1]);

  // Default: current
  return CURRENT_VERSION;
}

// ── Validate version ──────────────────────────────────────────────────────────

export function validateVersion(version: number): NextResponse | null {
  if (!SUPPORTED_VERSIONS.includes(version)) {
    return NextResponse.json(
      {
        error: 'UNSUPPORTED_API_VERSION',
        message: `API version v${version} is not supported`,
        supportedVersions: SUPPORTED_VERSIONS.map((v) => `v${v}`),
        latestVersion: `v${CURRENT_VERSION}`,
        docs: 'https://namainvist.com/api/docs',
      },
      {
        status: 400,
        headers: {
          'API-Version': String(CURRENT_VERSION),
          'Supported-Versions': SUPPORTED_VERSIONS.join(', '),
        },
      }
    );
  }
  return null;
}

// ── Add version headers to response ──────────────────────────────────────────

export function addVersionHeaders(response: NextResponse, version: number): NextResponse {
  response.headers.set('API-Version', String(version));
  response.headers.set('X-API-Version', String(version));

  const notice = DEPRECATION_NOTICE[version];
  if (notice) {
    response.headers.set('Deprecation', 'true');
    response.headers.set('Sunset', notice);
  }

  return response;
}

// ── Version-aware route rewriting ─────────────────────────────────────────────
// Strips /api/v1 prefix to route to the actual handler
// Used in Next.js middleware to rewrite /api/v1/sales → /api/sales

export function rewriteVersionedUrl(req: NextRequest): URL | null {
  const versionedPattern = /^\/api\/v(\d+)(\/.*)?$/;
  const match = req.nextUrl.pathname.match(versionedPattern);

  if (!match) return null;

  const version = parseInt(match[1]);
  const restPath = match[2] ?? '/';

  // Validate version
  if (!SUPPORTED_VERSIONS.includes(version)) return null;

  const newUrl = req.nextUrl.clone();
  newUrl.pathname = `/api${restPath}`;
  return newUrl;
}

// ── getVersionInfo ─────────────────────────────────────────────────────────────

export function getVersionInfo(version: number): VersionInfo {
  return {
    version,
    isLatest: version === CURRENT_VERSION,
    deprecationNotice: DEPRECATION_NOTICE[version],
  };
}
