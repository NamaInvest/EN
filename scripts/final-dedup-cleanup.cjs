/**
 * Final cleanup: Fix ALL remaining duplicate logger imports across codebase
 */
const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const IMPORT = "import { logger } from '@/lib/logger';";

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

function dedupFile(full) {
  const c = fs.readFileSync(full, 'utf8');
  const count = c.split(IMPORT).length - 1;
  if (count <= 1) return false;

  const lines = c.split('\n');
  const cleaned = [];
  let importSeen = 0;
  let logDeclSeen = 0;

  for (const l of lines) {
    if (l.trim() === IMPORT) {
      importSeen++;
      if (importSeen > 1) continue;
    }
    if (l.trim().startsWith('const log = logger.child(')) {
      logDeclSeen++;
      if (logDeclSeen > 1) continue;
    }
    cleaned.push(l);
  }

  // Dedupe consecutive blank lines
  const final = [];
  let lastBlank = false;
  for (const l of cleaned) {
    const blank = l.trim() === '';
    if (blank && lastBlank) continue;
    final.push(l);
    lastBlank = blank;
  }

  fs.writeFileSync(full, final.join('\n'), 'utf8');
  return true;
}

let fixed = 0;
const files = [
  ...walk(path.join(ROOT, 'src/app/api'), 'route.ts'),
  ...walk(path.join(ROOT, 'src/lib'), '.ts'),
];

for (const f of files) {
  if (f.includes('.test.') || f.includes('logger.ts')) continue;
  if (dedupFile(f)) {
    console.log('  DEDUPED:', f.replace(ROOT, '').replace(/\\/g, '/'));
    fixed++;
  }
}

console.log(`\nFixed ${fixed} files with duplicate logger imports.`);
