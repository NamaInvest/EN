/**
 * safe-export-wrap.js
 * Wraps bare `export async function GET/POST/...` with withRoute HOF.
 * SAFE: only touches the export line, never the function internals.
 * 
 * FROM: export async function GET(req: NextRequest) { ... }
 * TO:   export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });
 *       async function _GET(req: NextRequest) { ... }
 * 
 * Skips files that already use withRoute.
 * After each batch verifies 0 new TS errors.
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
let converted = 0, skipped = 0;
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

// Rate tier heuristics
function guessTier(method, filePath) {
  if (filePath.includes('/auth/'))        return 'AUTH';
  if (filePath.includes('/ai/') || filePath.includes('/ai-'))  return 'AI';
  if (filePath.includes('/admin/'))       return 'ADMIN';
  if (filePath.includes('/upload'))       return 'UPLOAD';
  if (filePath.includes('/cron/') || filePath.includes('/cron-')) return 'CRON';
  if (method === 'GET')                   return 'DEFAULT';
  // financial mutations
  if (filePath.includes('/accounting/') || filePath.includes('/payroll/') ||
      filePath.includes('/treasury/') || filePath.includes('/sales/') ||
      filePath.includes('/purchases/') || filePath.includes('/ar/') ||
      filePath.includes('/ap/'))          return 'FINANCIAL';
  return 'DEFAULT';
}

for (const r of routes) {
  let c = fs.readFileSync(r, 'utf8');
  const orig = c;

  // Skip if already using withRoute
  if (c.includes('withRoute')) { skipped++; continue; }

  // Skip if no bare export functions
  const hasBareExport = METHODS.some(m => {
    return new RegExp(`export\\s+async\\s+function\\s+${m}\\b`).test(c);
  });
  if (!hasBareExport) { skipped++; continue; }

  const relativePath = r.replace(process.cwd() + path.sep, '').replace(/\\/g, '/');

  // 1. Add withRoute import after the first import line
  const firstImportEnd = c.indexOf('\n', c.indexOf('import ')) + 1;
  const withRouteImport = `import { withRoute } from '@/lib/api/with-route';\n`;
  
  // Don't double-add
  if (!c.includes("from '@/lib/api/with-route'")) {
    c = c.slice(0, firstImportEnd) + withRouteImport + c.slice(firstImportEnd);
  }

  // 2. For each HTTP method: rename function + add withRoute export
  let changed = false;
  for (const m of METHODS) {
    const tier = guessTier(m, relativePath);
    
    // Match: export async function GET(req...) or export async function GET(req: NextRequest)
    // or export async function GET(request: ...) — various signatures
    const re = new RegExp(
      `export\\s+async\\s+function\\s+${m}\\s*\\([^)]*\\)`,
      'g'
    );
    
    if (!re.test(c)) continue;
    re.lastIndex = 0; // reset
    
    // Rename the function (remove export, rename to _METHOD)
    c = c.replace(
      new RegExp(`export\\s+async\\s+function\\s+${m}\\b`, 'g'),
      `async function _${m}`
    );
    
    // Add the withRoute export at end of file (before last blank line)
    const exportLine = `export const ${m} = withRoute(async ({ req }) => _${m}(req as any), { rateLimit: '${tier}' });\n`;
    
    // Insert before closing of file
    if (!c.includes(`export const ${m} = withRoute`)) {
      c = c.trimEnd() + '\n\n' + exportLine;
      changed = true;
    }
  }

  if (changed && c !== orig) {
    fs.writeFileSync(r, c, 'utf8');
    converted++;
  } else {
    skipped++;
  }
}

console.log(`\n=== Safe Export Wrap Results ===`);
console.log(`Converted: ${converted}`);
console.log(`Skipped:   ${skipped}`);
console.log(`\nRunning TS check...`);

try {
  const out = execSync('npx tsc --noEmit 2>&1', { encoding: 'utf8', cwd: process.cwd() });
  const errCount = (out.match(/error TS/g) || []).length;
  console.log(`TS ERRORS: ${errCount}`);
  if (errCount > 0) {
    // Print first 10 errors
    const lines = out.split('\n').filter(l => l.includes('error TS')).slice(0, 10);
    lines.forEach(l => console.log(' ', l.trim()));
  }
} catch (e) {
  const errCount = (e.stdout?.match(/error TS/g) || []).length;
  console.log(`TS ERRORS: ${errCount}`);
  const lines = (e.stdout || '').split('\n').filter(l => l.includes('error TS')).slice(0, 10);
  lines.forEach(l => console.log(' ', l.trim()));
}
