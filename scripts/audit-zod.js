const fs = require('fs');
const path = require('path');
const apiDir = 'src/app/api';

function walk(dir) {
  let results = [];
  try {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) results = results.concat(walk(full));
      else if (f === 'route.ts' && !full.includes('[')) results.push(full);
    }
  } catch(e) {}
  return results;
}

const routes = walk(apiDir);
let total = 0, withZod = 0, withRoute = 0, noAuth = 0;
const noZodList = [];

for (const r of routes) {
  const c = fs.readFileSync(r, 'utf8');
  total++;
  const hasZod = c.includes("from 'zod'") || c.includes('from "zod"');
  const hasRoute = c.includes('withRoute');
  const hasAuth = c.includes('getUserFromRequest') || c.includes('withRoute');
  if (hasZod) withZod++;
  if (hasRoute) withRoute++;
  if (!hasAuth) noAuth++;
  if (hasRoute && !hasZod) {
    const kb = (fs.statSync(r).size / 1024).toFixed(1);
    noZodList.push({ kb: parseFloat(kb), path: r });
  }
}

noZodList.sort((a,b) => b.kb - a.kb);

console.log('=== Coverage Summary ===');
console.log('Total routes:', total);
console.log('With Zod:', withZod, `(${Math.round(withZod/total*100)}%)`);
console.log('With withRoute:', withRoute);
console.log('No auth at all:', noAuth);
console.log('');
console.log('=== withRoute routes MISSING Zod (top 25 by size) ===');
noZodList.slice(0, 25).forEach(g => console.log(g.kb + 'KB  ' + g.path));
console.log('Total missing Zod (has withRoute):', noZodList.length);
