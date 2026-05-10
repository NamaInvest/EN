/**
 * Remove incorrect logger injections from test files
 * and fix any remaining misplaced injections
 */
const fs   = require('fs');
const path = require('path');

const ROOT        = path.join(__dirname, '..');
const IMPORT_LINE = `import { logger } from '@/lib/logger';`;

function fixTestFile(full) {
  let c = fs.readFileSync(full, 'utf8');
  if (!c.includes(IMPORT_LINE)) return false;

  const lines = c.split('\n');
  const cleaned = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // Remove logger import line
    if (l.trim() === IMPORT_LINE) continue;
    // Remove const log = ... line
    if (l.trim().startsWith('const log = logger.child(')) continue;
    cleaned.push(l);
  }

  // Remove consecutive blank lines that resulted
  const dedupe = [];
  let lastBlank = false;
  for (const l of cleaned) {
    const isBlank = l.trim() === '';
    if (isBlank && lastBlank) continue;
    dedupe.push(l);
    lastBlank = isBlank;
  }

  fs.writeFileSync(full, dedupe.join('\n'), 'utf8');
  return true;
}

const testFiles = [
  'src/lib/__tests__/financial-schemas.test.ts',
  'src/lib/document-state-machine.test.ts',
  'src/lib/validations.test.ts',
  'src/lib/zatca.test.ts',
  // scan for any others
];

// Also scan all test files
function walk(dir, results = []) {
  try {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, f.name);
      if (f.isDirectory()) walk(full, results);
      else if (f.name.endsWith('.test.ts') || f.name.endsWith('.test.tsx') || f.name.endsWith('.spec.ts')) {
        results.push(full);
      }
    }
  } catch (_) {}
  return results;
}

let fixed = 0;
const allTests = walk(path.join(ROOT, 'src'));
for (const f of allTests) {
  if (fixTestFile(f)) {
    console.log('  FIXED test:', f.replace(ROOT, ''));
    fixed++;
  }
}

// Also manually fix any files in testFiles list
for (const rel of testFiles) {
  const full = path.join(ROOT, rel);
  if (fs.existsSync(full) && fixTestFile(full)) {
    console.log('  FIXED:', rel);
    fixed++;
  }
}

console.log(`\nFixed ${fixed} test files.`);
