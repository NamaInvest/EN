const fs = require('fs'), path = require('path');
function walk(d, e, r = []) {
  try {
    for (const f of fs.readdirSync(d, {withFileTypes: true})) {
      const full = path.join(d, f.name);
      if (f.isDirectory()) walk(full, e, r);
      else if (f.name.endsWith(e)) r.push(full);
    }
  } catch (_) {}
  return r;
}

// 1. service names مكسورة لا تزال
const routes = [...walk('src/app/api', 'route.ts'), ...walk('src/lib', '.ts')];
let badNames = 0;
for (const f of routes) {
  const c = fs.readFileSync(f, 'utf8');
  if (c.includes("'D:.namasoft")) badNames++;
}
console.log('Files with bad service names remaining:', badNames);

// 2. console.log في lib (غير logger)
let consoleCalls = 0;
for (const f of walk('src/lib', '.ts')) {
  if (f.includes('.test.') || f.includes('logger.ts')) continue;
  const c = fs.readFileSync(f, 'utf8');
  consoleCalls += (c.match(/console\.(log|warn|error)\(/g) || []).length;
}
console.log('console.log in lib (non-logger):', consoleCalls);

// 3. E2E spec files count
const e2eCount = walk('tests/e2e', '.spec.ts').length;
console.log('Playwright spec files:', e2eCount);

// 4. package.json scripts
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const missingScripts = ['validate', 'db:migrate', 'clean'].filter(s => !pkg.scripts[s]);
console.log('Missing package.json scripts:', missingScripts.join(', ') || 'none');

// 5. README production mention
try {
  const readme = fs.readFileSync('README.md', 'utf8');
  console.log('README mentions production:', readme.toLowerCase().includes('production') || readme.includes('Go-Live'));
} catch(e) { console.log('README: not found'); }

// 6. أي TODO بقي في routes
let todoInRoutes = 0;
for (const f of walk('src/app/api', 'route.ts')) {
  const c = fs.readFileSync(f, 'utf8');
  const todos = (c.match(/\/\/ TODO/g) || []).length;
  todoInRoutes += todos;
}
console.log('TODO comments in routes:', todoInRoutes);

// 7. missing openapi coverage
try {
  const oa = fs.readFileSync('src/lib/openapi.ts', 'utf8');
  const pathCount = (oa.match(/paths:/g) || []).length;
  console.log('OpenAPI paths sections:', pathCount);
} catch(e) { console.log('openapi.ts not found'); }

// 8. test count
const srcTests = walk('src', '.test.ts').filter(f => !f.includes('.test.tsx'));
const domainTests = walk('tests', '.test.ts');
console.log('Total test files:', srcTests.length + domainTests.length, '(src:', srcTests.length, '+ tests:', domainTests.length + ')');
