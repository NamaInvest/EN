// fix-duplicate-take.cjs
'use strict';
const fs = require('fs');
const files = [
  'src/app/api/grn/route.ts',
  'src/app/api/manufacturing/route.ts',
  'src/app/api/sales-returns/route.ts'
];
const ROOT = require('path').resolve(__dirname, '..');
for (const rel of files) {
  const file = require('path').join(ROOT, rel);
  let c = fs.readFileSync(file, 'utf8');
  // Remove injected 'take: 100,' when there's already a 'take' variable below
  c = c.replace(/\.findMany\(\{ take: 100,\r?\n/g, '.findMany({\n');
  c = c.replace(/\.findMany\?\?\.?\(\{ take: 100,\r?\n/g, '.findMany?.({  \n');
  fs.writeFileSync(file, c, 'utf8');
  console.log('Fixed:', rel);
}
