/**
 * Fix files that had original logger import and got duplicate injection
 * These files already imported from './logger' — remove the '@/lib/logger' duplicate
 */
const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const INJECTED_IMPORT = `import { logger } from '@/lib/logger';`;

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

function fixDuplicate(full) {
  const c = fs.readFileSync(full, 'utf8');
  
  // Check if file has BOTH an original './logger' AND the injected '@/lib/logger'
  const hasOriginal  = c.includes("from './logger'") || c.includes('from "./logger"') ||
                       c.includes("from '../lib/logger'") || c.includes("from '../../lib/logger'");
  const hasInjected  = c.includes(INJECTED_IMPORT);
  
  if (!hasOriginal || !hasInjected) return false;

  const lines = c.split('\n');
  const cleaned = [];
  let removedInjectedImport = false;
  let removedLogDecl = false;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    
    // Remove the injected '@/lib/logger' import (keep original './logger')
    if (!removedInjectedImport && l.trim() === INJECTED_IMPORT) {
      removedInjectedImport = true;
      // Also remove the blank line after it if next line is blank
      if (lines[i+1]?.trim() === '') {
        i++;
      }
      continue;
    }
    
    // Remove the const log = declaration if it's from the injection 
    // (has the long path service name that was auto-generated)
    if (!removedLogDecl && l.trim().startsWith('const log = logger.child({ service:') && 
        (l.includes('D:.') || l.includes('namasoft9-3-main'))) {
      removedLogDecl = true;
      continue;
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
  return removedInjectedImport;
}

let fixed = 0;
const targets = [
  ...walk(path.join(ROOT, 'src/lib'), '.ts'),
  ...walk(path.join(ROOT, 'src/app/api'), 'route.ts'),
];

for (const full of targets) {
  if (full.includes('.test.') || full.includes('logger.ts')) continue;
  if (fixDuplicate(full)) {
    console.log('  ✓', full.replace(ROOT, '').replace(/\\/g, '/'));
    fixed++;
  }
}

console.log(`\nFixed ${fixed} files with original+injected duplicate.`);
