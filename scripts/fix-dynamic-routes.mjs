/**
 * fix-dynamic-routes.mjs
 * Fixes dynamic route files where _METHOD(req, params) expects 2 args but was called with 1.
 * Strategy: Change withRoute export to pass params from ctx OR update _METHOD calls.
 * 
 * For [id] routes: exports should pass params through
 * Pattern fix: withRoute(async (ctx) => _METHOD(ctx.req), opts)
 *           -> withRoute(async (ctx) => _METHOD(ctx.req, ctx.params ?? {}), opts)
 * 
 * AND add params to RouteContext (via ctx.params)
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const API_DIR = join(ROOT, 'src', 'app', 'api');

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

let fixed = 0;

function isDynamicRoute(filePath) {
  return filePath.includes('[');
}

function processFile(filePath) {
  if (!isDynamicRoute(filePath)) return;
  
  let content = readFileSync(filePath, 'utf8');
  const original = content;

  // Check if file has _METHOD(req, params) style (2-arg) definitions
  const hasTwoArgDefinition = METHODS.some(m => {
    const pattern = new RegExp(`async function _${m}\\s*\\([^)]+params[^)]+\\)`);
    return pattern.test(content);
  });

  if (!hasTwoArgDefinition) return;

  // Fix withRoute calls: _METHOD(ctx.req) -> _METHOD(ctx.req, { params: ctx.params })
  for (const method of METHODS) {
    // Only fix calls where the _METHOD is defined with 2 args
    const defPattern = new RegExp(`async function _${method}\\s*\\([^)]+params[^)]+\\)`);
    if (!defPattern.test(content)) continue;

    // Fix the export call
    const callPattern = new RegExp(
      `(export const ${method}\\s*=\\s*withRoute\\(async \\(ctx\\) => _${method}\\(ctx\\.req)\\)`,
      'g'
    );
    content = content.replace(
      callPattern,
      `$1, ctx.params as any))`
    );
  }

  if (content !== original) {
    writeFileSync(filePath, content, 'utf8');
    const rel = relative(ROOT, filePath);
    console.log(`✅ Fixed dynamic: ${rel}`);
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

console.log('🔧 Fixing dynamic route param passing...\n');
walk(API_DIR);
console.log(`\n📊 Fixed: ${fixed} dynamic route files`);
