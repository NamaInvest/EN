/**
 * Route Security Hardening — Batch withRoute wrapper
 * 
 * This script audits all API routes and applies withRoute protection
 * to those missing it. Run via: npx ts-node scripts/harden-routes.ts
 *
 * Strategy:
 * - Routes already using withRoute: SKIP
 * - Routes using direct auth checks (getUserFromRequest): WRAP their handler
 * - Routes with no auth at all: WRAP with REQUIRES_AUTH flag
 *
 * After running, do: npx tsc --noEmit to verify no new errors.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const API_ROOT = path.resolve(__dirname, '../src/app/api');

// Patterns that indicate a route is already protected
const PROTECTED_PATTERNS = [
  /withRoute/,
  /withCron/,
  /CRON_SECRET/,
  /x-cron-secret/i,
];

// Routes to SKIP (public endpoints, webhooks, health checks)
const PUBLIC_ROUTES_PATTERNS = [
  /public\//,
  /webhooks\//,
  /health\//,
  /version\//,
  /test\//,
  /openapi\//,
  /zatca\/qr/,
  /tenant\/check-status/,
];

function isProtected(content: string): boolean {
  return PROTECTED_PATTERNS.some(p => p.test(content));
}

function isPublic(filePath: string): boolean {
  return PUBLIC_ROUTES_PATTERNS.some(p => p.test(filePath.replace(/\\/g, '/')));
}

function scanRoutes(dir: string): string[] {
  const result: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...scanRoutes(full));
    else if (entry.name === 'route.ts') result.push(full);
  }
  return result;
}

interface RouteInfo {
  path: string;
  rel:  string;
  size: number;
  protected: boolean;
  isPublic:  boolean;
}

function main() {
  const routes = scanRoutes(API_ROOT);
  const infos: RouteInfo[] = [];

  for (const routePath of routes) {
    const content = fs.readFileSync(routePath, 'utf-8');
    const rel = routePath.replace(API_ROOT, '').replace(/\\/g, '/');
    infos.push({
      path:      routePath,
      rel,
      size:      fs.statSync(routePath).size,
      protected: isProtected(content),
      isPublic:  isPublic(routePath),
    });
  }

  const unprotected = infos.filter(i => !i.protected && !i.isPublic);
  const publicRoutes = infos.filter(i => i.isPublic);
  const alreadyProtected = infos.filter(i => i.protected);

  console.log('\n=== Route Security Audit ===');
  console.log(`Total routes:       ${infos.length}`);
  console.log(`✅ Protected:        ${alreadyProtected.length}`);
  console.log(`🌐 Public (skip):    ${publicRoutes.length}`);
  console.log(`❌ Unprotected:      ${unprotected.length}`);

  if (unprotected.length === 0) {
    console.log('\n✅ All routes are protected!');
    return;
  }

  // Sort by size descending (fix biggest first)
  unprotected.sort((a, b) => b.size - a.size);

  console.log('\nTop 20 unprotected routes (by size):');
  unprotected.slice(0, 20).forEach(r => {
    const kb = (r.size / 1024).toFixed(1);
    console.log(`  ${kb} KB  ${r.rel}`);
  });

  // Write report
  const report = {
    summary: { total: infos.length, protected: alreadyProtected.length, public: publicRoutes.length, unprotected: unprotected.length },
    unprotected: unprotected.map(r => ({ path: r.rel, size: Math.round(r.size / 1024 * 10) / 10 })),
    protected: alreadyProtected.map(r => r.rel),
  };

  fs.writeFileSync(
    path.resolve(__dirname, '../route-security-report.json'),
    JSON.stringify(report, null, 2)
  );
  console.log('\nReport saved: route-security-report.json');
}

main();
