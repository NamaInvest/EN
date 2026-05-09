/**
 * fix-missing-imports.mjs
 * Adds missing `import { withRoute }` to route files that use withRoute without importing it.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const API_DIR = join(ROOT, 'src', 'app', 'api');

let fixed = 0;

const WITH_ROUTE_IMPORT = `import { withRoute } from '@/lib/api/with-route';\n`;

function processFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  const original = content;

  const usesWithRoute = content.includes('withRoute(') || content.includes('withPublicRoute(');
  const hasImport = content.includes("from '@/lib/api/with-route'") || 
                    content.includes('from "@/lib/api/with-route"');

  if (usesWithRoute && !hasImport) {
    // Add import at the top, after any existing imports
    const lines = content.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) lastImportIdx = i;
    }
    if (lastImportIdx >= 0) {
      lines.splice(lastImportIdx + 1, 0, WITH_ROUTE_IMPORT.trim());
    } else {
      lines.unshift(WITH_ROUTE_IMPORT.trim());
    }
    content = lines.join('\n');
  }

  if (content !== original) {
    writeFileSync(filePath, content, 'utf8');
    const rel = relative(ROOT, filePath);
    console.log(`✅ Added withRoute import: ${rel}`);
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

console.log('🔧 Adding missing withRoute imports...\n');
walk(API_DIR);
console.log(`\n📊 Fixed: ${fixed} files`);
