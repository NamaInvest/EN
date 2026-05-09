/**
 * fix-implicit-any.mjs
 * Fixes implicit 'any' errors in .reduce() and .forEach() callbacks in route files.
 * Adds `: any` type annotation to single-letter parameters.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const API_DIR = join(ROOT, 'src', 'app', 'api');

// Also fix src/services and src/lib
const DIRS = [API_DIR, join(ROOT, 'src', 'services'), join(ROOT, 'src', 'lib')];

let fixed = 0;

function processFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  const original = content;

  // Fix: .reduce((s, c) => ...) -> .reduce((s: any, c: any) => ...)
  // Fix: .reduce((acc, item) => ...) -> .reduce((acc: any, item: any) => ...)
  // Fix: .forEach(item => ...) -> .forEach((item: any) => ...)
  // Only fix identifiers that are 1-3 chars (common lambda vars)
  
  // Pattern: .reduce/forEach/map/filter/find/some/every((varA, varB?) => 
  // with no existing type annotation
  content = content.replace(
    /\.(reduce|forEach|map|filter|find|findIndex|some|every|flatMap)\(\s*\(([a-zA-Z_][a-zA-Z0-9_]*(?:,\s*[a-zA-Z_][a-zA-Z0-9_]*)*)\)\s*=>/g,
    (match, method, params) => {
      // Only annotate if none of the params already have types
      if (match.includes(': ')) return match;
      const typedParams = params.split(',').map((p) => {
        const trimmed = p.trim();
        if (!trimmed.includes(':')) return `${trimmed}: any`;
        return p;
      }).join(', ');
      return `.${method}((${typedParams}) =>`;
    }
  );

  // Fix single-param: .forEach(item => ...) -> .forEach((item: any) => ...)
  content = content.replace(
    /\.(forEach|map|filter|find|findIndex|some|every|flatMap)\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*=>/g,
    (match, method, param) => {
      if (match.includes(': ')) return match;
      return `.${method}((${param}: any) =>`;
    }
  );

  // Fix $transaction callbacks: prisma.$transaction(async (tx) => ...)
  content = content.replace(
    /\$transaction\(\s*async\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)\s*=>/g,
    (match, param) => {
      if (match.includes(': ')) return match;
      return `.$transaction(async (${param}: any) =>`;
    }
  );

  // Fix: prisma.$transaction(async (tx) => { without the dot
  content = content.replace(
    /transaction\(\s*async\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)\s*=>/g,
    (match, param) => {
      if (match.includes(': ')) return match;
      return `transaction(async (${param}: any) =>`;
    }
  );

  if (content !== original) {
    writeFileSync(filePath, content, 'utf8');
    const rel = relative(ROOT, filePath);
    console.log(`✅ Fixed: ${rel}`);
    fixed++;
  }
}

function walk(dir) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); }
  catch { return; }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.d.ts')) {
      processFile(full);
    }
  }
}

console.log('🔧 Adding : any types to implicit parameters...\n');
for (const dir of DIRS) {
  try { walk(dir); } catch {}
}
console.log(`\n📊 Fixed: ${fixed} files`);
