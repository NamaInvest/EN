/**
 * fix-pagination-final.cjs
 * Adds take:100 to the 7 remaining findMany calls without pagination.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const TARGETS = [
  'src/app/api/accounting/coa/reset-to-socpa/route.ts',
  'src/app/api/fiscal-periods/route.ts',
  'src/app/api/grn/route.ts',
  'src/app/api/manufacturing/route.ts',
  'src/app/api/sales-returns/route.ts',
  'src/app/api/settings/route.ts',
  'src/app/api/work-shifts/route.ts',
];

let fixed = 0;

for (const rel of TARGETS) {
  const file = path.join(ROOT, rel.replace(/\//g, path.sep));
  if (!fs.existsSync(file)) { console.log(`  ⚠️  Not found: ${rel}`); continue; }

  let content = fs.readFileSync(file, 'utf8');
  const before = content;

  // Pattern 1: findMany() → findMany({ take: 100 })
  content = content.replace(/\.findMany\(\)/g, '.findMany({ take: 100 })');

  // Pattern 2: findMany({ without take — add take: 100 as first property
  // Matches findMany({ OR findMany?.({
  content = content.replace(
    /\.findMany\??\.?\(\{(?!\s*take:)/g,
    (match) => match.replace('({', '({ take: 100,')
  );

  if (content !== before) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`  ✅ ${rel}`);
    fixed++;
  } else {
    console.log(`  ℹ️  No change needed: ${rel}`);
  }
}

console.log(`\n✅ Fixed pagination in ${fixed} files`);
