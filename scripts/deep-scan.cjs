/**
 * Deep quality scan — finds every remaining improvement opportunity
 */
const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function walk(dir, ext, results = []) {
  try {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, f.name);
      if (f.isDirectory() && !f.name.startsWith('.') && f.name !== 'node_modules' && f.name !== '.next')
        walk(full, ext, results);
      else if (f.name.endsWith(ext)) results.push(full);
    }
  } catch (_) {}
  return results;
}

const routes = walk(path.join(ROOT, 'src/app/api'), 'route.ts');
const libs   = walk(path.join(ROOT, 'src/lib'), '.ts');
const tests  = [...walk(path.join(ROOT, 'tests'), '.test.ts'), ...walk(path.join(ROOT, 'src'), '.test.ts')];

// 1. Routes without error logging in catch blocks
let noErrLog = [];
for (const f of routes) {
  const c = fs.readFileSync(f, 'utf8');
  const rel = f.replace(ROOT, '').replace(/\\/g, '/').replace(/^\//, '');
  if (c.includes('} catch') && !c.includes('log.error') && !c.includes('log.warn')) {
    noErrLog.push(rel);
  }
}
console.log(`\n[1] Routes with silent catch (no log.error): ${noErrLog.length}`);
noErrLog.slice(0, 5).forEach(f => console.log('   ', f));

// 2. Routes with hardcoded strings instead of constants
let hardcoded = [];
for (const f of routes) {
  const c = fs.readFileSync(f, 'utf8');
  const rel = f.replace(ROOT, '').replace(/\\/g, '/').replace(/^\//, '');
  if (c.includes("'admin'") && !rel.includes('auth') && !rel.includes('seed')) {
    hardcoded.push(rel);
  }
}
console.log(`\n[2] Routes with hardcoded 'admin' role string: ${hardcoded.length}`);
hardcoded.slice(0, 5).forEach(f => console.log('   ', f));

// 3. Lib files with no JSDoc
let noJsdoc = [];
for (const f of libs) {
  if (f.includes('.test.') || f.includes('.d.ts')) continue;
  const c = fs.readFileSync(f, 'utf8');
  const rel = f.replace(ROOT, '').replace(/\\/g, '/').replace(/^\//, '');
  const exportedFns = (c.match(/^export (async )?function \w+/gm) || []).length;
  const jsdocs = (c.match(/\/\*\*/g) || []).length;
  if (exportedFns > 3 && jsdocs === 0) noJsdoc.push({ rel, fns: exportedFns });
}
console.log(`\n[3] Lib files with >3 exports but 0 JSDoc: ${noJsdoc.length}`);
noJsdoc.slice(0, 5).forEach(f => console.log(`    ${f.rel} (${f.fns} exports)`));

// 4. Missing pagination in GET routes
let noPagination = [];
for (const f of routes) {
  const c = fs.readFileSync(f, 'utf8');
  const rel = f.replace(ROOT, '').replace(/\\/g, '/').replace(/^\//, '');
  if (c.includes('findMany') && !c.includes('take:') && !c.includes('limit') && !c.includes('take =')) {
    noPagination.push(rel);
  }
}
console.log(`\n[4] Routes with findMany but no pagination: ${noPagination.length}`);
noPagination.slice(0, 8).forEach(f => console.log('   ', f));

// 5. Tests with empty test bodies
let emptyTests = [];
for (const f of tests) {
  const c = fs.readFileSync(f, 'utf8');
  const rel = f.replace(ROOT, '').replace(/\\/g, '/').replace(/^\//, '');
  if (c.includes('expect(true).toBe(true)') || (c.includes('it(') && c.match(/it\([^)]+\)\s*=>\s*\{\s*\}/))) {
    emptyTests.push(rel);
  }
}
console.log(`\n[5] Test files with empty/placeholder tests: ${emptyTests.length}`);
emptyTests.forEach(f => console.log('   ', f));

// 6. Check for missing indexes in schema
try {
  const schema = fs.readFileSync(path.join(ROOT, 'prisma/schema.prisma'), 'utf8');
  const models = (schema.match(/^model \w+/gm) || []).length;
  const indexes = (schema.match(/@@index/g) || []).length;
  const uniques = (schema.match(/@@unique/g) || []).length;
  console.log(`\n[6] Prisma schema: ${models} models, ${indexes} @@index, ${uniques} @@unique`);
} catch(e) { console.log('\n[6] Prisma schema: not found'); }

// 7. Check for missing openapi tags on routes
try {
  const oa = fs.readFileSync(path.join(ROOT, 'src/lib/openapi.ts'), 'utf8');
  const pathsCount = (oa.match(/\/api\//g) || []).length;
  console.log(`\n[7] OpenAPI: ${pathsCount} /api/ path entries documented`);
} catch(e) { console.log('\n[7] OpenAPI: could not read'); }

// 8. Routes that use $transaction but don't handle deadlock retry
let noRetry = [];
for (const f of routes) {
  const c = fs.readFileSync(f, 'utf8');
  const rel = f.replace(ROOT, '').replace(/\\/g, '/').replace(/^\//, '');
  if (c.includes('$transaction') && !c.includes('retry') && !c.includes('maxWait') && !c.includes('isolationLevel')) {
    noRetry.push(rel);
  }
}
console.log(`\n[8] Routes with $transaction but no isolation/retry: ${noRetry.length}`);
noRetry.slice(0, 5).forEach(f => console.log('   ', f));

// 9. Check for CONTRIBUTING.md, SECURITY.md
const docsCheck = ['CONTRIBUTING.md','SECURITY.md','CHANGELOG.md','.github/pull_request_template.md','.github/ISSUE_TEMPLATE/bug_report.md'];
const missingDocs = docsCheck.filter(d => !fs.existsSync(path.join(ROOT, d)));
console.log(`\n[9] Missing GitHub docs: ${missingDocs.length}`);
missingDocs.forEach(d => console.log('   ', d));

// 10. Check playwright.config.ts for missing features
try {
  const pw = fs.readFileSync(path.join(ROOT, 'playwright.config.ts'), 'utf8');
  console.log(`\n[10] playwright.config:`);
  console.log('   timeout configured:', pw.includes('timeout:'));
  console.log('   baseURL configured:', pw.includes('baseURL:'));
  console.log('   video on failure:', pw.includes('video'));
  console.log('   screenshot on failure:', pw.includes('screenshot'));
  console.log('   trace on failure:', pw.includes('trace'));
} catch(e) { console.log('\n[10] playwright.config.ts not found'); }

console.log('\n✅ Scan complete.');
