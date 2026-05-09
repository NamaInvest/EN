/**
 * fix-dynamic-routes.js
 * 
 * Fixes the broken dynamic [id] routes where _METHOD(req as any) 
 * should be _METHOD(req as any, context) because the original
 * function has 2 parameters (req + { params }).
 * 
 * Finds all lines like:
 *   export const PUT = withRoute(async ({ req }) => _PUT(req as any), ...)
 * Where _PUT has 2 parameters, and fixes to:
 *   export const PUT = withRoute(async ({ req }, context) => _PUT(req as any, context), ...)
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walk(dir) {
  let r = [];
  try {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) r = r.concat(walk(full));
      else if (f === 'route.ts') r.push(full);
    }
  } catch {}
  return r;
}

const routes = walk('src/app/api');
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
let fixed = 0, skipped = 0;

for (const r of routes) {
  let c = fs.readFileSync(r, 'utf8');
  const orig = c;

  // Only process files that have withRoute AND the old 1-arg call pattern
  if (!c.includes('withRoute')) { skipped++; continue; }

  let changed = false;

  for (const m of METHODS) {
    // Check if _METHOD function has 2 parameters (req + params/context)
    // Pattern: async function _METHOD(req, { params })  or  async function _METHOD(req: X, { params }: Y)
    const funcTwoArgRe = new RegExp(
      `async\\s+function\\s+_${m}\\s*\\([^,)]+,\\s*\\{\\s*params`,
      'm'
    );

    if (!funcTwoArgRe.test(c)) continue;

    // Fix the export line: add context param
    // FROM: withRoute(async ({ req }) => _METHOD(req as any), { rateLimit: '...' })
    // TO:   withRoute(async ({ req }, context) => _METHOD(req as any, context), { rateLimit: '...' })
    const exportOld = new RegExp(
      `(withRoute\\(async \\({ req }\\) => _${m}\\(req as any\\))`,
      'g'
    );

    const exportOldAlt = new RegExp(
      `(withRoute\\(async \\(\\{ req \\}\\) => _${m}\\(req as any\\))`,
      'g'
    );

    const newLine = `withRoute(async ({ req }, context) => _${m}(req as any, context)`;

    if (exportOld.test(c)) {
      c = c.replace(exportOld, newLine);
      changed = true;
    } else if (exportOldAlt.test(c)) {
      c = c.replace(exportOldAlt, newLine);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(r, c, 'utf8');
    fixed++;
  } else {
    skipped++;
  }
}

console.log(`Fixed dynamic route exports: ${fixed}`);
console.log(`Skipped: ${skipped}`);
console.log(`\nRunning TS check...`);

try {
  const out = execSync('npx tsc --noEmit 2>&1', { encoding: 'utf8', cwd: process.cwd() });
  const errCount = (out.match(/error TS/g) || []).length;
  console.log(`TS ERRORS: ${errCount}`);
  if (errCount > 0) {
    const lines = out.split('\n').filter(l => l.includes('error TS')).slice(0, 15);
    lines.forEach(l => console.log(' ', l.trim()));
  } else {
    console.log('✅ ZERO ERRORS');
  }
} catch (e) {
  const errCount = (e.stdout?.match(/error TS/g) || []).length;
  console.log(`TS ERRORS: ${errCount}`);
  const lines = (e.stdout || '').split('\n').filter(l => l.includes('error TS')).slice(0, 15);
  lines.forEach(l => console.log(' ', l.trim()));
}
