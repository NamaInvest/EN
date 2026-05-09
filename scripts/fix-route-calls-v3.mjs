/**
 * fix-route-calls-v3.mjs
 * Fixes the pattern: withRoute(async (ctx) => _METHOD(ctx.req, ctx as any), opts)
 * Changes to:       withRoute(async (ctx) => _METHOD(ctx.req), opts)
 * 
 * The private _GET/_POST etc. functions only accept (req: NextRequest),
 * but they were being called with an extra ctx argument.
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

  for (const method of METHODS) {
    // Pattern 1: _METHOD(ctx.req, ctx as any) -> _METHOD(ctx.req)
    const pattern1 = new RegExp(`(_${method}\\(ctx\\.req,\\s*ctx(?:\\s+as\\s+any)?\\))`, 'g');
    content = content.replace(pattern1, `_${method}(ctx.req)`);

    // Pattern 2: _METHOD(ctx.req, ctx) -> _METHOD(ctx.req)
    const pattern2 = new RegExp(`(_${method}\\(ctx\\.req,\\s*ctx\\))`, 'g');
    content = content.replace(pattern2, `_${method}(ctx.req)`);
  }

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

console.log('🔧 Fixing _METHOD(ctx.req, ctx as any) -> _METHOD(ctx.req)...\n');
walk(API_DIR);
console.log(`\n📊 Fixed: ${fixed} files`);
