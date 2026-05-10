/**
 * Batch console.log → logger migration for lib files + high-traffic API routes
 * Covers: salla.ts, field-audit.ts, bnpl.ts, telegram-bot.ts, zatca.ts,
 *         zatca/onboard route, settings route, accounting/accounts route,
 *         products/[id], customers/[id], shifts, employees/[id], system/numbering
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IMPORT_LINE = `import { logger } from '@/lib/logger';`;

function migrateFile(rel, serviceName, extras = {}) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) { console.log(`  SKIP: ${rel}`); return; }

  let c = fs.readFileSync(full, 'utf8');
  const hasLogger = c.includes(IMPORT_LINE);

  if (!hasLogger) {
    // find last import line
    const lines = c.split('\n');
    let lastImport = 0;
    lines.forEach((l, i) => { if (l.startsWith('import ') || l.startsWith("import{")) lastImport = i; });
    lines.splice(lastImport + 1, 0,
      `${IMPORT_LINE}\n\nconst log = logger.child({ service: '${serviceName}' });`
    );
    c = lines.join('\n');
  }

  let n = 0;
  for (const [o, r] of [
    ['console.error(', 'log.error('],
    ['console.warn(',  'log.warn('],
    ['console.log(',   'log.info('],
    ['console.debug(', 'log.debug('],
  ]) {
    while (c.includes(o)) { c = c.replace(o, r); n++; }
  }

  // Apply any extra string replacements (e.g. emoji cleanup)
  for (const [o, r] of Object.entries(extras)) {
    c = c.split(o).join(r);
  }

  fs.writeFileSync(full, c, 'utf8');
  console.log(`  ✓ ${rel}  (${n} calls, logger injected: ${!hasLogger})`);
}

// ── LIB FILES ───────────────────────────────────────────────────────────────
console.log('\n=== lib files ===');
migrateFile('src/lib/salla.ts',         'Salla');
migrateFile('src/lib/field-audit.ts',   'FieldAudit');
migrateFile('src/lib/bnpl.ts',          'BNPL');
migrateFile('src/lib/telegram-bot.ts',  'TelegramBot');
migrateFile('src/lib/zatca.ts',         'ZATCA');
migrateFile('src/lib/coordinator.ts',   'Coordinator');
migrateFile('src/lib/registry.ts',      'Registry');
migrateFile('src/lib/ragas-runner.ts',  'RAGASRunner');
migrateFile('src/lib/with-cron.ts',     'WithCron');
migrateFile('src/lib/pipeline.ts',      'Pipeline');
migrateFile('src/lib/unsplash.ts',      'Unsplash');
migrateFile('src/lib/r2.ts',            'R2Storage');
migrateFile('src/lib/custom-report-engine.ts', 'CustomReport');
migrateFile('src/lib/env.ts',           'Env');
migrateFile('src/lib/hybrid-search.ts', 'HybridSearch');
migrateFile('src/lib/cron-guard.ts',    'CronGuard');
migrateFile('src/lib/quotaGuard.ts',    'QuotaGuard');
migrateFile('src/lib/generator.ts',     'Generator');

// ── API ROUTES ───────────────────────────────────────────────────────────────
console.log('\n=== api routes ===');

const apiRoutes = [
  ['src/app/api/zatca/onboard/route.ts',              'zatca/onboard'],
  ['src/app/api/settings/route.ts',                   'settings'],
  ['src/app/api/accounting/accounts/route.ts',        'accounting/accounts'],
  ['src/app/api/accounting/journal/[id]/route.ts',    'accounting/journal'],
  ['src/app/api/accounting/cost-centers/route.ts',    'accounting/cost-centers'],
  ['src/app/api/employees/[id]/route.ts',             'employees'],
  ['src/app/api/shifts/route.ts',                     'shifts'],
  ['src/app/api/system/numbering/route.ts',           'system/numbering'],
  ['src/app/api/cron/rem-leases/route.ts',            'cron/rem-leases'],
  ['src/app/api/enterprise/projects/route.ts',        'enterprise/projects'],
  ['src/app/api/tenant/provision/route.ts',           'tenant/provision'],
  ['src/app/api/purchases/grn/route.ts',              'purchases/grn'],
];

// products/[id] — dynamic path
const productsId = path.join('src', 'app', 'api', 'products', '[id]', 'route.ts');
if (!fs.existsSync(productsId)) {
  // find actual path
  const found = fs.readdirSync(path.join(ROOT, 'src', 'app', 'api', 'products'), { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => path.join('src', 'app', 'api', 'products', d.name, 'route.ts'))
    .find(p => fs.existsSync(path.join(ROOT, p)));
  if (found) apiRoutes.push([found, 'products/id']);
} else {
  apiRoutes.push([productsId, 'products/id']);
}

// customers/[id]
const customersId = path.join('src', 'app', 'api', 'customers', '[id]', 'route.ts');
if (fs.existsSync(path.join(ROOT, customersId))) apiRoutes.push([customersId, 'customers/id']);

// sales/returns
const salesReturns = 'src/app/api/sales/returns/[id]/[...slug]/route.ts';
if (fs.existsSync(path.join(ROOT, salesReturns))) apiRoutes.push([salesReturns, 'sales/returns']);

for (const [rel, name] of apiRoutes) {
  migrateFile(rel, name);
}

console.log('\n✅ All migrations done!');
