/**
 * Add default pagination (take: 100) to findMany calls without any limit
 */
const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const targets = [
  'src/app/api/accounting/coa/reset-to-socpa/route.ts',
  'src/app/api/fiscal-periods/route.ts',
  'src/app/api/grn/route.ts',
  'src/app/api/manufacturing/route.ts',
  'src/app/api/sales-returns/route.ts',
  'src/app/api/settings/route.ts',
  'src/app/api/work-shifts/route.ts',
];

let fixed = 0;
for (const rel of targets) {
  const f = path.join(ROOT, rel);
  if (!fs.existsSync(f)) continue;
  let c = fs.readFileSync(f, 'utf8');

  // Add take:100 to findMany calls that don't already have take/limit/skip
  const before = c;
  
  // Pattern: .findMany({ without take:
  c = c.replace(/\.findMany\(\{(?![^}]*take:)(?![^}]*limit)/g, (match) => {
    if (match.includes('take:') || match.includes('limit')) return match;
    return '.findMany({ take: 100,';
  });

  // Pattern: .findMany() with no args at all
  c = c.replace(/\.findMany\(\)/g, '.findMany({ take: 100 })');

  if (c !== before) {
    fs.writeFileSync(f, c, 'utf8');
    fixed++;
    console.log('  Paginated:', rel);
  }
}
console.log(`\nFixed pagination in ${fixed} files.`);
