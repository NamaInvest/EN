/**
 * safe-migrate-small-routes.js
 * 
 * SAFELY converts small routes (<4KB) from old delegate pattern to native withRoute.
 * Only transforms the EXPORT LINES — doesn't touch the internal function bodies.
 * 
 * Transformation:
 *   FROM: export const GET = withRoute(async (ctx) => _GET(ctx.req), { ... });
 *   TO:   export const GET = withRoute(async ({ req }) => _GET(req as any), { ... });
 * 
 * This keeps the internal _GET/_POST functions intact (zero risk of breaking logic)
 * while fixing the ctx.req → req pattern for consistency.
 */
const fs = require('fs');
const path = require('path');

function walk(dir) {
  let r = [];
  try {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) r = r.concat(walk(full));
      else if (f === 'route.ts' && !full.includes('[')) r.push(full);
    }
  } catch (e) {}
  return r;
}

const routes = walk('src/app/api');
let migrated = 0, skipped = 0;

for (const r of routes) {
  const stat = fs.statSync(r);
  
  // Only process files that:
  // 1. Use old ctx pattern
  // 2. Are any size (safe transformation of export lines only)
  let c = fs.readFileSync(r, 'utf8');
  const original = c;
  
  if (!c.includes('withRoute(async (ctx) =>')) {
    skipped++;
    continue;
  }

  // Transform export delegate lines:
  // withRoute(async (ctx) => _METHOD(ctx.req), ...) 
  // → withRoute(async ({ req }) => _METHOD(req as any), ...)
  const transformed = c.replace(
    /withRoute\(async \(ctx\) => _(\w+)\(ctx\.req\)/g,
    (match, fn) => `withRoute(async ({ req }) => _${fn}(req as any)`
  );

  if (transformed !== original) {
    fs.writeFileSync(r, transformed, 'utf8');
    migrated++;
  } else {
    skipped++;
  }
}

console.log(`Migrated export lines: ${migrated} files`);
console.log(`Skipped: ${skipped} files`);
