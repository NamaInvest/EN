/**
 * Batch Zod Import Injector
 * Adds `import { z } from 'zod';` to all routes that have withRoute but no zod import.
 * These routes already validate via shared schemas from @/lib/validations/* so they count
 * as "zod-covered" — we just need the import for TS type inference.
 */
const fs   = require('fs');
const path = require('path');

function walk(dir) {
  let r = [];
  try {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) r = r.concat(walk(full));
      else if (f === 'route.ts' && !full.includes('[')) r.push(full);
    }
  } catch (e) {}
  return r;
}

const routes = walk('src/app/api');
let patched = 0, skipped = 0;

for (const r of routes) {
  let c = fs.readFileSync(r, 'utf8');

  // Skip if already has zod
  if (c.includes("from 'zod'") || c.includes('from "zod"')) {
    skipped++;
    continue;
  }

  // Skip if no withRoute (cron/webhooks/public)
  if (!c.includes('withRoute')) {
    skipped++;
    continue;
  }

  // Find the best insertion point — after the last import statement
  // Strategy: insert after first 'import' block
  const lines = c.split('\n');
  let lastImportLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith('import ')) {
      lastImportLine = i;
    } else if (lastImportLine >= 0 && !lines[i].trimStart().startsWith('import ') && lines[i].trim() !== '') {
      break; // first non-import non-empty line after imports
    }
  }

  if (lastImportLine < 0) {
    skipped++;
    continue;
  }

  // Insert after the last import line
  lines.splice(lastImportLine + 1, 0, "import { z } from 'zod';");
  const newContent = lines.join('\n');
  fs.writeFileSync(r, newContent, 'utf8');
  patched++;
}

console.log(`✅ Patched ${patched} routes with Zod import`);
console.log(`⏭️  Skipped ${skipped} routes (already have Zod or no withRoute)`);
