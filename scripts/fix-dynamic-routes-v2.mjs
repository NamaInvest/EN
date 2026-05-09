/**
 * fix-dynamic-routes-v2.mjs
 * Fixes the broken bracket pattern from fix-dynamic-routes.mjs:
 * BAD:  withRoute(async (ctx) => _PUT(ctx.req, ctx.params as any)), { opts })
 * GOOD: withRoute(async (ctx) => _PUT(ctx.req, ctx.params as any), { opts })
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

  // Fix: (ctx.params as any)), { rateLimit  ->  (ctx.params as any), { rateLimit
  // This pattern: _METHOD(ctx.req, ctx.params as any)), { 
  // Should be:    _METHOD(ctx.req, ctx.params as any), {
  content = content.replace(
    /(_(?:GET|POST|PUT|PATCH|DELETE)\(ctx\.req,\s*ctx\.params as any\))\),\s*(\{)/g,
    '$1, $2'
  );

  // Also fix: _METHOD(ctx.req, ctx.params as any), { ... }); -- ensure no extra )
  // If already correct, skip

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
    else if (entry.name === 'route.ts') processFile(full);
  }
}

console.log('🔧 Fixing broken bracket pattern from dynamic route script...\n');
walk(API_DIR);
console.log(`\n📊 Fixed: ${fixed} files`);
