/**
 * Fix broken logger injections — detects misplaced imports inside multi-line import blocks
 * and moves them to the correct position (after the last complete import statement)
 */
const fs   = require('fs');
const path = require('path');

const ROOT        = path.join(__dirname, '..');
const IMPORT_LINE = `import { logger } from '@/lib/logger';`;
const LOG_DECL    = `const log = logger.child({`;

function walk(dir, exts, results = []) {
  try {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, f.name);
      if (f.isDirectory()) walk(full, exts, results);
      else if (exts.some(e => f.name.endsWith(e))) results.push(full);
    }
  } catch (_) {}
  return results;
}

function fixFile(full) {
  let c = fs.readFileSync(full, 'utf8');

  // Check if there's a misplaced logger injection
  if (!c.includes(IMPORT_LINE)) return false;

  // Detect pattern: import block line followed by logger import (broken injection)
  // Pattern: "} from '...'" NOT followed by IMPORT_LINE, or IMPORT_LINE appearing mid-import
  const lines = c.split('\n');

  // Find all lines that contain the logger injection
  const loggerLineIdx = lines.findIndex(l => l.trim() === IMPORT_LINE);
  const logDeclIdx    = lines.findIndex(l => l.trim().startsWith(LOG_DECL));

  if (loggerLineIdx === -1) return false;

  // Check if the injection is misplaced (appears mid-import block)
  // Signs: lines around it are part of an import (no ';' before, lines starting with identifiers, 'from', etc.)
  const prevLine = loggerLineIdx > 0 ? lines[loggerLineIdx - 1].trim() : '';
  const nextLine = loggerLineIdx < lines.length - 1 ? lines[loggerLineIdx + 1].trim() : '';

  const isMisplaced = (
    // line before is part of an import (e.g. "import {" body)
    prevLine === '' && nextLine === '' // Double empty — injection is isolated, fine
      ? false
      : (prevLine.endsWith(',') || prevLine === 'import {' || 
         /^[A-Za-z_$]/.test(prevLine) && !prevLine.startsWith('import') && !prevLine.startsWith('export') && !prevLine.startsWith('const') && !prevLine.startsWith('//') ||
         nextLine.endsWith(',') || nextLine.startsWith('} from'))
  );

  if (!isMisplaced) return false;

  // ── Strategy: remove the injected block and re-inject after last complete import ──
  // Remove logger import line and the blank lines and const log line around it
  const cleaned = [];
  let skip = 0;
  for (let i = 0; i < lines.length; i++) {
    if (skip > 0) { skip--; continue; }
    const l = lines[i].trim();
    if (l === IMPORT_LINE) {
      // Check if next lines are blank + const log
      if (lines[i+1]?.trim() === '' && lines[i+2]?.trim().startsWith(LOG_DECL)) {
        skip = 2; // skip blank + const log
      } else if (lines[i+1]?.trim().startsWith(LOG_DECL)) {
        skip = 1; // skip const log
      }
      continue;
    }
    cleaned.push(lines[i]);
  }

  // Also remove any blank line that was added before/after
  // Now find the correct insertion point: after the last 'import ... ;' or 'import ... from ...'
  const rebuilt = cleaned;
  let lastCompleteImport = -1;
  let inMultiLineImport = false;

  for (let i = 0; i < rebuilt.length; i++) {
    const l = rebuilt[i];
    if (l.trim().startsWith("import ") && !l.includes(';')) {
      inMultiLineImport = true;
    }
    if (inMultiLineImport && l.includes(';')) {
      inMultiLineImport = false;
      lastCompleteImport = i;
    }
    if (l.trim().startsWith("import ") && l.includes(';')) {
      lastCompleteImport = i;
    }
    if (l.trim().startsWith("import ") && (l.includes("from '") || l.includes('from "')) && l.trim().endsWith("';") || l.trim().endsWith('";')) {
      lastCompleteImport = i;
    }
  }

  // Determine service name from file path
  const rel = full.replace(ROOT, '').replace(/\\/g, '/');
  const svc = rel
    .replace(/^\/src\/app\/api\//, '').replace(/^\/src\/app\//, '').replace(/^\/src\/lib\//, '')
    .replace(/\/(route|page)\.tsx?$/, '')
    .replace(/\//g, '.').slice(0, 40);

  // Insert after lastCompleteImport
  if (lastCompleteImport >= 0) {
    rebuilt.splice(lastCompleteImport + 1, 0,
      `${IMPORT_LINE}\n\nconst log = logger.child({ service: '${svc}' });`
    );
  } else {
    rebuilt.unshift(`${IMPORT_LINE}\n\nconst log = logger.child({ service: '${svc}' });\n`);
  }

  fs.writeFileSync(full, rebuilt.join('\n'), 'utf8');
  return true;
}

// Process all app and lib files
let fixed = 0;
const files = [
  ...walk(path.join(ROOT, 'src/app'), ['.tsx', '.ts']),
  ...walk(path.join(ROOT, 'src/lib'), ['.ts']),
];

for (const f of files) {
  if (f.includes('logger.ts') || f.includes('.test.')) continue;
  if (fixFile(f)) {
    console.log('  FIXED:', f.replace(ROOT, ''));
    fixed++;
  }
}

console.log(`\nFixed ${fixed} files with misplaced logger injections.`);
