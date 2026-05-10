/**
 * Fix the broken template literals in shopfloor and stock-transfers routes
 */
const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// ── Fix shopfloor route ─────────────────────────────────────────────────────
{
  const f = path.join(ROOT, 'src/app/api/manufacturing/shopfloor/route.ts');
  let c = fs.readFileSync(f, 'utf8');

  // Fix broken reference string (template literal lost backticks)
  c = c.replace(
    'reference: SFS-, description: WIP Relief,',
    'reference: `SFS-${body.sessionId}`, description: `WIP Relief`,',
  );

  fs.writeFileSync(f, c, 'utf8');
  console.log('  shopfloor: fixed');
}

// ── Fix stock-transfers route ──────────────────────────────────────────────
{
  const f = path.join(ROOT, 'src/app/api/stock-transfers/route.ts');
  let c = fs.readFileSync(f, 'utf8');

  // Check what's broken at line ~138
  const lines = c.split('\n');
  console.log('  stock-transfers lines 134-142:');
  lines.slice(133, 142).forEach((l, i) => console.log(`  ${i + 134}: ${l}`));
}
