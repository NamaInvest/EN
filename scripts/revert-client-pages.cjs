/**
 * Revert logger injection from client-side pages ('use client') 
 * These pages should keep console.log since they run in the browser
 * Also fix TS2345 errors from wrong log.info argument types in pages
 */
const fs   = require('fs');
const path = require('path');

const ROOT        = path.join(__dirname, '..');
const IMPORT_LINE = `import { logger } from '@/lib/logger';`;

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

function revertClientPage(full) {
  const c = fs.readFileSync(full, 'utf8');
  
  // Only revert if it's a 'use client' file
  if (!c.includes("'use client'") && !c.includes('"use client"')) return false;
  if (!c.includes(IMPORT_LINE)) return false;

  const lines = c.split('\n');
  const cleaned = [];
  let skip = false;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    // Remove logger import
    if (l.trim() === IMPORT_LINE) { skip = true; continue; }
    // Remove blank line after import
    if (skip && l.trim() === '') { skip = false; continue; }
    skip = false;
    
    // Remove const log = line
    if (l.trim().startsWith('const log = logger.child(')) continue;

    // Revert log.* back to console.*
    let out = l;
    out = out.replace(/\blog\.error\(/g, 'console.error(');
    out = out.replace(/\blog\.warn\(/g, 'console.warn(');
    out = out.replace(/\blog\.info\(/g, 'console.log(');
    out = out.replace(/\blog\.debug\(/g, 'console.debug(');

    cleaned.push(out);
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
  return true;
}

// Process all page.tsx files (client components)
const pages = walk(path.join(ROOT, 'src/app'), '.tsx');
let reverted = 0;
for (const f of pages) {
  if (!f.endsWith('page.tsx')) continue;
  if (revertClientPage(f)) {
    console.log('  REVERTED:', f.replace(ROOT, ''));
    reverted++;
  }
}

console.log(`\nReverted ${reverted} client pages.`);
console.log('Server-side routes (route.ts) are untouched.');
