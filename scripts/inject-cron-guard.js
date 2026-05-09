#!/usr/bin/env node
/**
 * inject-cron-guard.js
 * يُضيف استدعاء requireCronSecret لكل cron routes تلقائياً
 */
const fs   = require('fs');
const path = require('path');

const CRON_ROUTES = [
  'src/app/api/cron/debts/route.ts',
  'src/app/api/cron/hr/route.ts',
  'src/app/api/cron/predictive-po/route.ts',
  'src/app/api/cron/rem-leases/route.ts',
  'src/app/api/cron/self-healer/route.ts',
  'src/app/api/cron/shifts/route.ts',
  'src/app/api/subscriptions/process-renewals/route.ts',
];

const IMPORT_LINE = `import { requireCronSecret } from '@/lib/cron-guard';\n`;
const GUARD_CALL  = `  const guard = requireCronSecret(req as any);\n  if (guard) return guard;\n\n`;

let patched = 0;
let skipped = 0;

for (const relPath of CRON_ROUTES) {
  const absPath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(absPath)) {
    console.log(`⚠  SKIP (not found): ${relPath}`);
    skipped++;
    continue;
  }

  let content = fs.readFileSync(absPath, 'utf-8');

  // Already patched?
  if (content.includes('requireCronSecret') || content.includes('guardCron')) {
    console.log(`✓  SKIP (already guarded): ${relPath}`);
    skipped++;
    continue;
  }

  // Add import after last existing import line
  const lastImportIdx = content.lastIndexOf('\nimport ');
  if (lastImportIdx === -1) {
    console.log(`⚠  SKIP (no imports found): ${relPath}`);
    skipped++;
    continue;
  }
  const afterImports = content.indexOf('\n', lastImportIdx + 1) + 1;
  content = content.slice(0, afterImports) + IMPORT_LINE + content.slice(afterImports);

  // Add guard call at start of first async function body
  // Find "async function _POST" or "async function _GET"
  const fnMatch = content.match(/async function _(?:POST|GET)\s*\([^)]*\)\s*\{/);
  if (!fnMatch) {
    console.log(`⚠  SKIP (no handler found): ${relPath}`);
    skipped++;
    continue;
  }

  const fnStart = content.indexOf(fnMatch[0]) + fnMatch[0].length;
  // Skip whitespace/newline after {
  let insertAt = fnStart;
  while (insertAt < content.length && (content[insertAt] === '\r' || content[insertAt] === '\n' || content[insertAt] === ' ')) {
    insertAt++;
  }
  // Go back to after the newline
  insertAt = content.indexOf('\n', fnStart) + 1;

  content = content.slice(0, insertAt) + GUARD_CALL + content.slice(insertAt);

  // Ensure req is named 'req' in the handler params
  content = content
    .replace(/async function _POST\(request: Request\)/, 'async function _POST(req: Request)')
    .replace(/async function _GET\(request: Request\)/, 'async function _GET(req: Request)')
    .replace(/const prisma = getPrisma\(request\)/, 'const prisma = getPrisma(req)')
    .replace(/const prisma = getPrisma\(request as any\)/, 'const prisma = getPrisma(req as any)');

  fs.writeFileSync(absPath, content, 'utf-8');
  console.log(`✅ PATCHED: ${relPath}`);
  patched++;
}

console.log(`\n📊 Done: ${patched} patched, ${skipped} skipped`);
