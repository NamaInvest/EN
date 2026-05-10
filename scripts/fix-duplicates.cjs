/**
 * Fix: Remove duplicate logger imports and fix TS2554 in documents route
 */
const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const IMPORT_LINE = `import { logger } from '@/lib/logger';`;

function removeDuplicateLogger(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) { console.log('  SKIP:', rel); return; }

  let c = fs.readFileSync(full, 'utf8');
  const lines = c.split('\n');

  let loggerImportCount = 0;
  let logDeclCount = 0;
  const cleaned = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim() === IMPORT_LINE) {
      loggerImportCount++;
      if (loggerImportCount > 1) continue; // remove duplicate
    }
    if (l.trim().startsWith('const log = logger.child(')) {
      logDeclCount++;
      if (logDeclCount > 1) continue; // remove duplicate
    }
    cleaned.push(l);
  }

  // Dedupe blank lines
  const dedupe = [];
  let lastBlank = false;
  for (const l of cleaned) {
    const isBlank = l.trim() === '';
    if (isBlank && lastBlank) continue;
    dedupe.push(l);
    lastBlank = isBlank;
  }

  fs.writeFileSync(full, dedupe.join('\n'), 'utf8');
  console.log(`  ✓ ${rel} (imports: ${loggerImportCount}, decls: ${logDeclCount})`);
}

// Fix known duplicates
const duplicates = [
  'src/lib/ab-testing.ts',
  'src/lib/api-handler.ts',
  'src/lib/mcp-bridge.ts',
];

for (const rel of duplicates) {
  removeDuplicateLogger(rel);
}

// Fix documents/[id]/route.ts TS2554 — 3-arg log call
const docPath = path.join(ROOT, 'src/app/api/documents/[id]/route.ts');
if (fs.existsSync(docPath)) {
  let c = fs.readFileSync(docPath, 'utf8');
  const lines = c.split('\n');
  const fixed = lines.map(l => {
    // log.error('msg', val1, val2) -> log.error('msg', { detail: val1 })
    return l.replace(/log\.(error|warn|info)\(([^,\n]+),\s*([^,\n]+),\s*([^)\n]+)\)/g,
      (_, level, msg, a, b) => `log.${level}(${msg}, { detail: ${a.trim()}, extra: ${b.trim()} })`
    );
  });
  fs.writeFileSync(docPath, fixed.join('\n'), 'utf8');
  console.log('  ✓ documents/[id]/route.ts TS2554 fixed');
}

// Also scan all lib files for duplicates
function walk(dir, ext, results = []) {
  try {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, f.name);
      if (f.isDirectory()) walk(full, ext, results);
      else if (f.name.endsWith(ext)) results.push(full);
    }
  } catch (_) {}
  return results;
}

let autoFixed = 0;
for (const full of walk(path.join(ROOT, 'src/lib'), '.ts')) {
  if (full.includes('.test.') || full.includes('logger.ts')) continue;
  const c = fs.readFileSync(full, 'utf8');
  const count = (c.split(IMPORT_LINE).length - 1);
  if (count > 1) {
    const rel = full.replace(ROOT + path.sep, '').replace(/\\/g, '/');
    removeDuplicateLogger(rel);
    autoFixed++;
  }
}

for (const full of walk(path.join(ROOT, 'src/app/api'), 'route.ts')) {
  const c = fs.readFileSync(full, 'utf8');
  const count = (c.split(IMPORT_LINE).length - 1);
  if (count > 1) {
    const rel = full.replace(ROOT + path.sep, '').replace(/\\/g, '/');
    removeDuplicateLogger(rel);
    autoFixed++;
  }
}

console.log(`\nAuto-fixed ${autoFixed} additional duplicate files. Done!`);
