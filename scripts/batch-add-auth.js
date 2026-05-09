/**
 * Batch Auth Guard Injector
 * Adds minimum getUserFromRequest auth check to all routes that lack any auth.
 * 
 * Strategy:
 * - Skip: routes with withRoute, getUserFromRequest, or in excluded list
 * - Skip: webhook/cron routes (use different auth)
 * - Add: import + auth check after first "const prisma = ..."
 */
const fs   = require('fs');
const path = require('path');

const EXCLUDED = new Set([
  'auth/login',
  'auth/register',
  'auth/refresh',
  'auth/sso-redirect',
  'crm/whatsapp/webhook',
  'telegram/webhook',
  'whatsapp/interactive',
  'cron/trigger-invoices',
  'cron/scheduled-reports',
  'zatca',          // has own ZATCA auth
  'openapi',        // public endpoint
  'admin/e2e-test', // test only
  'ice/desktop-licenses', // license check - different auth
  'ice/desktop-register',
  'ice/toggle',
  'ice/tenants',
  'tenant/provision', // admin-level superuser
]);

const API_DIR = path.join(__dirname, '..', 'src', 'app', 'api');

function walk(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walk(full));
    else if (entry.name === 'route.ts') results.push(full);
  }
  return results;
}

function relKey(filePath) {
  return filePath
    .replace(API_DIR + path.sep, '')
    .replace(path.sep + 'route.ts', '')
    .split(path.sep).join('/');
}

const files  = walk(API_DIR);
let patched  = 0, skipped = 0;

const AUTH_IMPORT = `import { getUserFromRequest } from '@/lib/auth';`;
const AUTH_CHECK = `\n  const auth = getUserFromRequest(request as any);\n  if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });\n`;

for (const file of files) {
  // Skip dynamic [id] routes for now (need individual care)
  if (file.includes('[')) { skipped++; continue; }

  const key = relKey(file);
  if ([...EXCLUDED].some(ex => key.startsWith(ex))) { skipped++; continue; }

  let c = fs.readFileSync(file, 'utf8');

  // Skip if already has auth
  if (c.includes('getUserFromRequest') || c.includes('withRoute') || c.includes('_guardUser')) {
    skipped++;
    continue;
  }

  let changed = false;

  // 1. Add import if missing
  if (!c.includes("from '@/lib/auth'")) {
    // Insert after last import line
    const lastImport = c.lastIndexOf("\nimport ");
    if (lastImport !== -1) {
      const eol = c.indexOf('\n', lastImport + 1);
      c = c.slice(0, eol + 1) + AUTH_IMPORT + '\n' + c.slice(eol + 1);
    } else {
      c = AUTH_IMPORT + '\n' + c;
    }
    changed = true;
  }

  // 2. Find each exported function and inject auth check after "const prisma = ..."
  // Pattern: "const prisma = getPrisma(..." — inject auth right after
  const PRISMA_PATTERN = /(const prisma = getPrisma\([^)]*\);(?:\r?\n)?)/g;
  let match;
  let newContent = c;
  let inserted   = 0;

  // Reset and scan
  const lines = c.split('\n');
  const outLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    outLines.push(lines[i]);
    // After "const prisma = getPrisma..." add auth check  
    if (/^\s+const prisma = getPrisma\(/.test(lines[i]) && inserted === 0) {
      // Check next lines don't already have auth
      const nextFew = lines.slice(i+1, i+5).join('\n');
      if (!nextFew.includes('getUserFromRequest') && !nextFew.includes('auth =')) {
        outLines.push('    const auth = getUserFromRequest(request as any);');
        outLines.push('    if (!auth) return NextResponse.json({ error: \'غير مصرح\' }, { status: 401 });');
        inserted++;
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(file, outLines.join('\n'));
    console.log(`PATCHED [${key}]`);
    patched++;
  } else {
    skipped++;
  }
}

console.log(`\n=== DONE: patched=${patched}, skipped=${skipped} ===`);
