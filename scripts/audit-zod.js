const fs   = require('fs');
const path = require('path');

function walk(dir) {
  let r = [];
  try {
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) r = r.concat(walk(full));
      else if (f === 'route.ts') r.push(full);
    }
  } catch {}
  return r;
}

const routes = walk('src/app/api');
const noZod = routes.filter(f => {
  const c = fs.readFileSync(f, 'utf8');
  const hasMutation = c.includes('export const POST') || 
                      c.includes('export const PUT') || 
                      c.includes('export const PATCH') || 
                      c.includes('export const DELETE');
  const hasZod = c.includes("from 'zod'") || c.includes('from "zod"');
  return hasMutation && !hasZod;
});

console.log('Routes without Zod: ' + noZod.length + ' / ' + routes.length);
noZod.forEach(f => {
  const rel = f.replace(/.*src.app.api./, '').replace(/route\.ts$/, '');
  console.log('  ' + rel);
});
