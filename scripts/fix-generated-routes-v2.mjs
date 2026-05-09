/**
 * fix-generated-routes-v2.mjs
 * Fixes route files with duplicate export const GET/POST/PUT/PATCH/DELETE declarations.
 * Keeps only the LAST (most recently added) version of each method.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const API_DIR = join(ROOT, 'src', 'app', 'api');

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

let fixed = 0;

function processFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  const original = content;

  // Fix: duplicate export const METHOD = ...
  // Strategy: split by lines, for each METHOD find all export lines, keep only last
  const lines = content.split('\n');
  
  for (const method of METHODS) {
    // Find all line indices that export this method
    const regex = new RegExp(`^export const ${method}\\s*=`);
    const matchingIndices = lines
      .map((line, i) => regex.test(line.trim()) ? i : -1)
      .filter(i => i !== -1);

    if (matchingIndices.length > 1) {
      // Remove all but the last occurrence
      const toRemove = matchingIndices.slice(0, -1);
      for (const idx of toRemove) {
        lines[idx] = ''; // blank the line
      }
      console.log(`  - Removed ${toRemove.length} duplicate ${method} exports`);
    }
  }

  content = lines.join('\n');

  // Fix: multiple blank lines in a row (cleanup)
  content = content.replace(/\n{4,}/g, '\n\n');

  if (content !== original) {
    writeFileSync(filePath, content, 'utf8');
    const rel = relative(ROOT, filePath);
    console.log(`✅ Fixed: ${rel}`);
    fixed++;
  }
}

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name === 'route.ts') processFile(full);
  }
}

console.log('🔧 Fixing duplicate method exports in route files...\n');
walk(API_DIR);
console.log(`\n📊 Fixed: ${fixed} files`);
