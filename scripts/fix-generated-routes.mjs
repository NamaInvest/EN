/**
 * fix-generated-routes.mjs
 * Fixes route files that have broken generated patterns:
 *   1. }export const GET = ... (missing newline after closing brace)
 *   2. _GET/_POST/_PUT redeclaration errors
 *   3. withRoute called inline as IIFE - converts to clean export pattern
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const API_DIR = join(ROOT, 'src', 'app', 'api');

// Pattern: }export const GET = (req: any) => withRoute(async (ctx) => ..., opts)(req);
// We replace with:
// }
// export const GET = withRoute(async (ctx) => ..., opts);
const IIFE_PATTERN = /\}(export const (?:GET|POST|PUT|PATCH|DELETE)\s+=\s+\(req:\s*any\)\s*=>\s*withRoute\(async\s*\(ctx\)\s*=>\s*[^;]+\)(?:\(req\))?;)/g;

let fixed = 0;
let errors = 0;

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.name === 'route.ts') {
      processFile(full);
    }
  }
}

function processFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8');
    const original = content;

    // Fix 1: }export -> }\nexport (missing newline)
    content = content.replace(/\}(export const (?:GET|POST|PUT|PATCH|DELETE))/g, '}\n$1');

    // Fix 2: (req: any) => withRoute(handler, opts)(req)  →  withRoute(handler, opts)
    // Pattern: export const GET = (req: any) => withRoute(async (ctx) => ..., { ... })(req);
    content = content.replace(
      /export const (GET|POST|PUT|PATCH|DELETE)\s*=\s*\(req:\s*any\)\s*=>\s*(withRoute\([^;]+)\(req\);/g,
      'export const $1 = $2;'
    );

    // Fix 3: Remove duplicate export const (GET|POST|...) declarations
    // Find all export const GET = ... lines; if there are duplicates, keep only the LAST one
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    for (const method of methods) {
      const regex = new RegExp(`export const ${method}[^;]+;`, 'g');
      const matches = [...content.matchAll(regex)];
      if (matches.length > 1) {
        // Keep only the last occurrence; remove all previous
        let idx = 0;
        content = content.replace(regex, (match) => {
          idx++;
          return idx < matches.length ? '' : match;
        });
      }
    }

    // Fix 4: _GET/_POST etc. referenced but not defined - they're the old function names
    // Pattern: async (ctx) => (typeof _GET !== 'undefined' ? _GET(ctx.req, ctx) : ...)
    // Simplify to: async (ctx) => _GET(ctx.req, ctx) or keep as-is if _GET IS defined
    // Actually we just need to ensure _GET etc refer to the private functions in the file
    // Check if _GET is defined in the file
    for (const method of methods) {
      const privateName = `_${method}`;
      const isDefined = content.includes(`async function ${privateName}`) || 
                        content.includes(`function ${privateName}`) ||
                        content.includes(`const ${privateName} =`) ||
                        content.includes(`async function ${privateName}`);
      if (!isDefined) {
        // Remove the typeof check wrapper - replace with 405 fallback
        const safePattern = new RegExp(
          `\\(typeof ${privateName} !== 'undefined' \\? ${privateName}\\([^)]+\\) : new Response\\(null,\\{status:405\\}\\)\\)`,
          'g'
        );
        content = content.replace(safePattern, `new Response(null, { status: 405 })`);
      }
    }

    if (content !== original) {
      writeFileSync(filePath, content, 'utf8');
      const rel = relative(ROOT, filePath);
      console.log(`✅ Fixed: ${rel}`);
      fixed++;
    }
  } catch (err) {
    console.error(`❌ Error processing ${filePath}:`, err.message);
    errors++;
  }
}

console.log('🔧 Fixing generated route files...\n');
walk(API_DIR);
console.log(`\n📊 Results: ${fixed} fixed, ${errors} errors`);
