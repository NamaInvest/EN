/**
 * MASTER logger migration — covers ALL remaining routes + pages
 * Scans every route.ts and page.tsx, injects logger, replaces console.*
 * Safe: skips files that already have logger injected
 *       skips @ts-nocheck files
 *       skips logger.ts itself
 */
const fs   = require('fs');
const path = require('path');

const ROOT        = path.join(__dirname, '..');
const IMPORT_LINE = `import { logger } from '@/lib/logger';`;

// ─── helpers ────────────────────────────────────────────────────────────────

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

function serviceNameFromPath(full) {
  return full
    .replace(/\\/g, '/')
    .replace(/.*\/src\/app\/api\//, '')
    .replace(/\/route\.ts$/, '')
    .replace(/\/page\.tsx$/, '')
    .replace(/\[/g, '').replace(/\]/g, '')
    .replace(/\//g, '.')
    .slice(0, 40);
}

function migrateConsole(content, serviceName) {
  const hasLogger   = content.includes(IMPORT_LINE);
  const isNoCheck   = content.includes('@ts-nocheck');
  const isLoggerSelf= content.includes("export function logger") || content.includes('export const logger');

  if (isLoggerSelf) return { content, changed: 0, injected: false };

  let c = content;

  // Inject logger import if not present
  let injected = false;
  if (!hasLogger) {
    const lines = c.split('\n');
    let lastImport = -1;
    lines.forEach((l, i) => {
      if (/^import[\s{]/.test(l.trim())) lastImport = i;
    });
    if (lastImport >= 0) {
      lines.splice(lastImport + 1, 0,
        `${IMPORT_LINE}\n\nconst log = logger.child({ service: '${serviceName}' });`
      );
      c = lines.join('\n');
      injected = true;
    } else {
      // No import found — prepend
      c = `${IMPORT_LINE}\n\nconst log = logger.child({ service: '${serviceName}' });\n\n` + c;
      injected = true;
    }
  }

  // Replace console.* calls
  let changed = 0;
  for (const [from, to] of [
    ['console.error(', 'log.error('],
    ['console.warn(',  'log.warn('],
    ['console.log(',   'log.info('],
    ['console.debug(', 'log.debug('],
  ]) {
    const count = (c.split(from).length - 1);
    if (count > 0) {
      c = c.split(from).join(to);
      changed += count;
    }
  }

  return { content: c, changed, injected };
}

// ─── main ────────────────────────────────────────────────────────────────────

let totalFiles = 0, totalCalls = 0, totalInjected = 0;

function processDir(dir, ext) {
  const files = walk(path.join(ROOT, dir), ext);
  for (const full of files) {
    const rel  = full.replace(ROOT + path.sep, '').replace(/\\/g, '/');
    const orig = fs.readFileSync(full, 'utf8');

    // Skip if already fully migrated OR is logger itself
    if (orig.includes(IMPORT_LINE) && !(orig.includes('console.log(') || orig.includes('console.error(') || orig.includes('console.warn('))) {
      continue;
    }
    if (orig.includes('export const logger') || orig.includes('export function logger') ||
        rel.includes('/logger.ts') || rel.includes('/logger/')) {
      continue;
    }

    const svc = serviceNameFromPath(full);
    const { content, changed, injected } = migrateConsole(orig, svc);

    if (changed > 0 || injected) {
      fs.writeFileSync(full, content, 'utf8');
      if (changed > 0) {
        console.log(`  ✓ ${rel.padEnd(70)} ${changed} calls`);
        totalFiles++;
        totalCalls += changed;
        if (injected) totalInjected++;
      }
    }
  }
}

console.log('\n=== Processing API routes ===');
processDir('src/app/api', 'route.ts');

console.log('\n=== Processing pages (client-side console) ===');
processDir('src/app', 'page.tsx');

console.log('\n=== Processing lib (remaining) ===');
processDir('src/lib', '.ts');

console.log(`
✅ DONE
   Files changed : ${totalFiles}
   console calls : ${totalCalls}
   logger injected: ${totalInjected}
`);
