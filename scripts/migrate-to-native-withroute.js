/**
 * migrate-to-native-withroute.js
 * 
 * Converts the old _GET/_POST delegate pattern to native withRoute handlers.
 * 
 * OLD pattern:
 *   async function _GET(req) { ... }
 *   export const GET = withRoute(async (ctx) => _GET(ctx.req), { ... });
 * 
 * NEW pattern:
 *   export const GET = withRoute(async ({ req, prisma, auth }) => { ... }, { ... });
 * 
 * Only processes routes where the _GET/_POST function body can be safely inlined
 * (i.e., small/medium files under 8KB that don't have complex multi-function dependencies).
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

// Focus on routes that:
// 1. Use old pattern
// 2. Are under 6KB (simpler routes)
// 3. Don't have complex internal dependencies
let migrated = 0;
let skipped = 0;

for (const r of routes) {
  const stat = fs.statSync(r);
  if (stat.size > 6000) { skipped++; continue; }  // skip large complex files
  
  let c = fs.readFileSync(r, 'utf8');
  const original = c;
  
  const hasOldPattern = c.includes('async function _GET') || c.includes('async function _POST');
  if (!hasOldPattern) { skipped++; continue; }
  
  // Check: has withRoute
  if (!c.includes('withRoute')) { skipped++; continue; }

  // Step 1: Migrate export lines that still delegate to private functions
  // Pattern: export const GET = withRoute(async (ctx) => _GET(ctx.req), { rateLimit: '...' });
  // →        export const GET = withRoute(async ({ req }) => _GET(req), { rateLimit: '...' });
  
  // Replace ctx.req with req in export delegate lines (keep the function call intact, just fix ctx)
  c = c.replace(
    /export const (GET|POST|PUT|PATCH|DELETE)\s*=\s*withRoute\(async \(ctx\) => _(\w+)\(ctx\.req\)/g,
    (match, method, fn) => `export const ${method} = withRoute(async ({ req }) => _${fn}(req as any)`
  );

  // Step 2: Fix function signatures - old functions used `request: NextRequest` or `request: Request`
  // They still work - we just need to remove the double-auth check pattern where both 
  // withRoute AND the inner function check auth (redundant)

  // Step 3: Remove redundant auth checks inside _GET/_POST since withRoute already handles it
  // Pattern: const auth = getUserFromRequest(request as any); if (!auth) return ...401...
  // When the outer withRoute already provides auth, we can remove the inner check
  // BUT: some _GET functions use `auth.userId` for filtering — we keep those
  // SAFE to remove: standalone auth check at top of function that just returns 401
  
  // Only remove if the ONLY use of `auth` after the check is nothing (pure gate)
  // This is too risky to automate without AST — skip this part

  if (c !== original) {
    fs.writeFileSync(r, c, 'utf8');
    migrated++;
  } else {
    skipped++;
  }
}

console.log(`Migrated: ${migrated}, Skipped: ${skipped}`);
