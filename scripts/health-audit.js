const fs = require('fs');
const path = require('path');

function walk(dir) {
  let r = [];
  try {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) r = r.concat(walk(full));
      else if (f === 'route.ts') r.push(full);
    }
  } catch(e) {}
  return r;
}

const routes = walk('src/app/api');
let stats = {
  total: 0, dynamic: 0, static: 0, withRoute: 0,
  oldPattern: 0, nativeWithRoute: 0, inlineZod: 0,
  missingZodSchema: 0, hasTsIgnore: 0, hasTsExpect: 0,
};

const oldPatternList = [];
const missingSchemaList = [];

for (const r of routes) {
  const c = fs.readFileSync(r, 'utf8');
  const isDynamic = r.includes('[');
  stats.total++;
  if (isDynamic) stats.dynamic++;
  else stats.static++;

  const hasWithRoute = c.includes('withRoute');
  const hasOldPattern = hasWithRoute && (c.includes('async function _GET') || c.includes('async function _POST'));
  const zodMarker1 = "from 'zod'";
  const zodMarker2 = 'from "zod"';
  const hasZodImport = c.includes(zodMarker1) || c.includes(zodMarker2);
  const hasInlineSchema = hasZodImport && (
    c.includes('z.object(') || c.includes('z.discriminatedUnion') ||
    c.includes('z.string()') || c.includes('z.number()') || c.includes('z.array(')
  );
  const hasTsIgnore = c.includes('@ts-ignore');
  const hasTsExpect = c.includes('@ts-expect-error');

  if (hasWithRoute) stats.withRoute++;
  if (hasOldPattern) {
    stats.oldPattern++;
    oldPatternList.push({ kb: (fs.statSync(r).size / 1024).toFixed(1), path: r });
  }
  if (!isDynamic && hasWithRoute && !hasOldPattern) stats.nativeWithRoute++;
  if (hasInlineSchema) stats.inlineZod++;
  if (!isDynamic && hasWithRoute && hasZodImport && !hasInlineSchema) {
    stats.missingZodSchema++;
    missingSchemaList.push(r);
  }
  if (hasTsIgnore) stats.hasTsIgnore++;
  if (hasTsExpect) stats.hasTsExpect++;
}

console.log('=== SYSTEM HEALTH METRICS ===');
Object.entries(stats).forEach(([k, v]) => console.log(k + ': ' + v));
console.log('');
console.log('Top 15 old-pattern routes (largest first):');
oldPatternList.sort((a,b) => parseFloat(b.kb) - parseFloat(a.kb)).slice(0, 15).forEach(x => console.log(x.kb + 'KB  ' + x.path));
console.log('');
console.log('withRoute+zod-import but NO inline schema (first 10):');
missingSchemaList.slice(0, 10).forEach(x => console.log(x));
