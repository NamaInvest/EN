/**
 * fix-silent-catches-safe.cjs
 * ─────────────────────────────────────────────────────────────────────────
 * Safely adds log.error() inside catch blocks that have NO logging at all.
 *
 * Strategy:
 * 1. Find catch blocks using bracket-counting (not regex lookahead)
 * 2. Check if block contains any log.* or console.* call
 * 3. If silent → insert log.error after the opening brace
 * 4. Ensure the file imports { logger } and has a log declaration
 *
 * Safe: only modifies catch bodies, never touches non-catch code.
 *
 * Usage: node scripts/fix-silent-catches-safe.cjs [--dry-run]
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const ROOT    = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

// ── Helpers ─────────────────────────────────────────────────────────────────

function walk(dir, results = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !['node_modules', '.next', '.git', '__tests__', 'tests'].includes(e.name)) {
      walk(full, results);
    } else if (e.isFile() && e.name === 'route.ts') {
      results.push(full);
    }
  }
  return results;
}

/** Extract all catch blocks with their content and positions */
function extractCatchBlocks(source) {
  const blocks = [];
  // Match: catch (err) { or catch { or catch(err: any) {
  const catchPattern = /catch\s*(?:\([^)]*\))?\s*\{/g;
  let match;

  while ((match = catchPattern.exec(source)) !== null) {
    const openBrace = match.index + match[0].length - 1; // position of {
    let depth = 1;
    let i = openBrace + 1;

    while (i < source.length && depth > 0) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}') depth--;
      i++;
    }

    const blockStart = openBrace;       // index of {
    const blockEnd   = i - 1;           // index of }
    const body       = source.slice(blockStart + 1, blockEnd); // content inside braces

    // Extract the catch variable name if any
    const varMatch = match[0].match(/catch\s*\(([^)]*)\)/);
    const catchVar = varMatch ? varMatch[1].split(':')[0].trim() : 'err';

    blocks.push({ blockStart, blockEnd, body, catchVar, matchStr: match[0] });
  }

  return blocks;
}

/** True if the catch body already has any log or console call */
function hasSomeLogging(body) {
  return /\b(log\.|console\.|logger\.)/.test(body);
}

/** True if the catch body is effectively empty or just has return/NextResponse */
function isEmptyOrReturn(body) {
  const trimmed = body.trim();
  // Allow empty, whitespace-only, single return, or NextResponse.json
  return (
    trimmed === '' ||
    /^return\s*(null|undefined|NextResponse\.json\([^)]*\))?;?\s*$/.test(trimmed)
  );
}

/** Ensure the file has logger import + log child declaration */
function ensureLoggerInFile(source, serviceName) {
  let result = source;

  if (!result.includes("from '@/lib/logger'") && !result.includes('from "../lib/logger"')) {
    // Add after last import
    const lastImport = result.lastIndexOf('\nimport ');
    const insertAfter = result.indexOf('\n', lastImport + 1);
    result =
      result.slice(0, insertAfter + 1) +
      "import { logger } from '@/lib/logger';\n" +
      result.slice(insertAfter + 1);
  }

  if (!result.includes('const log =') && !result.includes('const log=')) {
    // Add after logger import
    const loggerImportEnd = result.indexOf('\n', result.indexOf("from '@/lib/logger'"));
    result =
      result.slice(0, loggerImportEnd + 1) +
      `const log = logger.child({ service: '${serviceName}' });\n` +
      result.slice(loggerImportEnd + 1);
  }

  return result;
}

// ── Main ────────────────────────────────────────────────────────────────────

const apiDir   = path.join(ROOT, 'src', 'app', 'api');
const files    = walk(apiDir);

let totalFixed    = 0;
let totalSkipped  = 0;
let totalFiles    = 0;

for (const file of files) {
  let source = fs.readFileSync(file, 'utf8');
  const rel  = path.relative(ROOT, file);

  const blocks = extractCatchBlocks(source);
  if (blocks.length === 0) { totalSkipped++; continue; }

  // Check which blocks are silent
  const silentBlocks = blocks.filter(b => !hasSomeLogging(b.body));
  if (silentBlocks.length === 0) { totalSkipped++; continue; }

  // ── Build the new source by iterating blocks in reverse (to preserve indices) ──
  let modified = source;
  let injected = 0;

  for (const block of silentBlocks.reverse()) {
    const { blockStart, blockEnd, body, catchVar } = block;

    // Skip if body is truly trivial (empty or bare return)
    if (isEmptyOrReturn(body)) continue;

    // The error variable name — use 'err' if it's '_' or empty
    const logVar = catchVar === '_' || catchVar === '' ? 'err' : catchVar;

    // Determine indent: look at first non-empty line in body
    const firstLine = body.split('\n').find(l => l.trim().length > 0) || '    ';
    const indent    = firstLine.match(/^(\s*)/)?.[1] ?? '    ';

    // Build the log line
    const logLine = `${indent}log.error('${rel.replace(/\\/g, '/')}', { error: ${logVar} instanceof Error ? ${logVar}.message : ${logVar} });\n`;

    // Insert after the opening brace
    const insertAt = blockStart + 1; // right after {
    modified = modified.slice(0, insertAt) + '\n' + logLine + modified.slice(insertAt);
    injected++;
  }

  if (injected === 0) { totalSkipped++; continue; }

  // Derive service name from file path
  const parts      = rel.replace(/\\/g, '/').split('/');
  const apiIdx     = parts.indexOf('api');
  const serviceName = parts.slice(apiIdx + 1, -1).join('.') || 'api';

  // Ensure logger is imported
  modified = ensureLoggerInFile(modified, serviceName);

  if (!DRY_RUN) {
    fs.writeFileSync(file, modified, 'utf8');
  }

  console.log(`  ✅ ${rel} (+${injected} log.error)`);
  totalFixed++;
  totalFiles++;
}

console.log(`\n📊 Results:`);
console.log(`  Files modified:  ${totalFixed}`);
console.log(`  Files skipped:   ${totalSkipped}`);
console.log(DRY_RUN ? '  DRY RUN — no files written' : '  Changes written to disk');
