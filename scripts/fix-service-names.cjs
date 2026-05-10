/**
 * Fix all long machine-path service names to clean short names
 * Pattern: service: 'D:.namasoft9-3-main.src...' -> service: 'clean-name'
 */
const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function walk(dir, ext, results = []) {
  try {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, f.name);
      if (f.isDirectory()) walk(full, ext, results);
      else if (f.name.endsWith(ext)) results.push(full);
    }
  } catch (_) {}
  return results;
}

let fixed = 0;
const files = [
  ...walk(path.join(ROOT, 'src/lib'), '.ts'),
  ...walk(path.join(ROOT, 'src/app/api'), 'route.ts'),
];

for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  
  // Detect machine-path service names
  if (!c.includes("'D:.namasoft9-3-main") && !c.includes("D:.namasoft9-3-main")) continue;

  // Derive clean service name from file path
  const rel = f.replace(ROOT, '').replace(/\\/g, '/');
  let svc = rel
    .replace(/^\/src\/lib\//, '')
    .replace(/^\/src\/app\/api\//, '')
    .replace(/\/route\.ts$/, '')
    .replace(/\.ts$/, '')
    .replace(/\//g, '.');
  if (svc.length > 40) svc = svc.slice(0, 40);

  // Replace the long path pattern
  c = c.replace(/service: 'D:[^']+'/g, `service: '${svc}'`);

  fs.writeFileSync(f, c, 'utf8');
  console.log(`  ✓ ${svc}`);
  fixed++;
}

console.log(`\nFixed ${fixed} files with machine-path service names.`);
