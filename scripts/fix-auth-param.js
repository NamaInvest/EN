/**
 * Fix-Auth-Param: Replace getUserFromRequest(request as any) with getUserFromRequest(req as any)
 * in functions where the parameter is named 'req' not 'request'
 */
const fs   = require('fs');
const path = require('path');

function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(full));
    else if (e.name === 'route.ts') out.push(full);
  }
  return out;
}

const files = walk(path.join(__dirname, '..', 'src', 'app', 'api'));
let total = 0;

for (const file of files) {
  let c;
  try { c = fs.readFileSync(file, 'utf8'); } catch { continue; }
  if (!c.includes('getUserFromRequest(request as any)')) continue;

  const lines = c.split('\n');
  let inReqFn = false;
  let changed = false;
  const out = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect exported async function signature
    if (/export async function \w+\(req[^u]/.test(line) || /export async function \w+\(req\b/.test(line)) {
      inReqFn = true;
    } else if (/export async function \w+\(request/.test(line)) {
      inReqFn = false;
    } else if (line.startsWith('export async function') || line.startsWith('export function')) {
      inReqFn = false;
    }

    if (inReqFn && line.includes('getUserFromRequest(request as any)')) {
      out.push(line.replace('getUserFromRequest(request as any)', 'getUserFromRequest(req as any)'));
      changed = true;
    } else {
      out.push(line);
    }
  }

  if (changed) {
    fs.writeFileSync(file, out.join('\n'));
    total++;
    console.log('FIXED:', file.split('src/app/api/').pop() || file);
  }
}

console.log('\nTotal files fixed:', total);
