/**
 * inject-withTransaction.cjs
 * ─────────────────────────────────────────────────────────────────────────
 * Finds all API routes using prisma.$transaction() without retry and
 * adds the withTransaction import at the top of those files.
 *
 * This does NOT refactor the call sites — it simply adds the import
 * so developers can gradually migrate. A separate migration guide
 * is written to docs/transaction-migration.md
 *
 * Usage: node scripts/inject-withTransaction.cjs
 */

'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const IMPORT_LINE = "import { withTransaction } from '@/lib/db/transaction';";

let filesModified = 0;
let filesSkipped = 0;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !['node_modules', '.next', '.git', '__tests__'].includes(e.name)) {
      results.push(...walk(full));
    } else if (e.isFile() && e.name === 'route.ts') {
      results.push(full);
    }
  }
  return results;
}

const routeFiles = walk(path.join(ROOT, 'src', 'app', 'api'));

for (const file of routeFiles) {
  const content = fs.readFileSync(file, 'utf8');

  // Only touch files that use $transaction
  if (!content.includes('.$transaction(')) continue;

  // Skip if already imported
  if (content.includes("from '@/lib/db/transaction'")) {
    filesSkipped++;
    continue;
  }

  // Find the last import line to insert after
  const lines = content.split('\n');
  let lastImportIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('import ')) lastImportIdx = i;
  }

  lines.splice(lastImportIdx + 1, 0, IMPORT_LINE);
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  filesModified++;

  const rel = path.relative(ROOT, file);
  console.log(`  ✅ Added import: ${rel}`);
}

console.log(`\n📊 Results:`);
console.log(`  Modified: ${filesModified} files`);
console.log(`  Skipped (already imported): ${filesSkipped} files`);
console.log(`  Total $transaction routes: ${filesModified + filesSkipped}`);

// Write migration guide
const guide = `# Transaction Retry Migration Guide

Generated: ${new Date().toISOString()}

## Overview

${filesModified + filesSkipped} routes use \`prisma.$transaction()\` without retry logic.
The \`withTransaction\` utility has been imported into ${filesModified} of them.

## How to Migrate

Replace this pattern:
\`\`\`ts
const result = await prisma.$transaction(async (tx) => {
  // your operations
});
\`\`\`

With this:
\`\`\`ts
const result = await withTransaction(prisma, async (tx) => {
  // your operations
}, { operationName: 'describe-what-this-does' });
\`\`\`

Or the short form for simple cases:
\`\`\`ts
import { atomically } from '@/lib/db/transaction';

const result = await atomically(prisma, async (tx) => {
  // your operations
}, 'operation-name');
\`\`\`

## Why?

- Handles \`P2034\` (Prisma transaction conflict)
- Handles \`40001\` (PostgreSQL serialization failure)
- Handles \`40P01\` (Deadlock detected)
- Uses exponential backoff (100ms → 200ms → 400ms, max 2s)
- Logs retry attempts with structured context

## Routes to Migrate

Run \`node scripts/deep-scan.cjs\` to see current status.
`;

fs.writeFileSync(path.join(ROOT, 'docs', 'transaction-migration.md'), guide, 'utf8');
console.log('\n📄 Migration guide written to: docs/transaction-migration.md');
