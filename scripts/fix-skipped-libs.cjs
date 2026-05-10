/**
 * Fix skipped files (subdirectory lib paths) + remaining routes
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IMPORT_LINE = `import { logger } from '@/lib/logger';`;

function migrateFile(rel, serviceName) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) { console.log(`  SKIP: ${rel}`); return 0; }

  let c = fs.readFileSync(full, 'utf8');
  const hasLogger = c.includes(IMPORT_LINE);

  if (!hasLogger) {
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

  fs.writeFileSync(full, c, 'utf8');
  console.log(`  ✓ ${rel}  (${n} calls)`);
  return n;
}

const targets = [
  // sub-lib paths (correct)
  ['src/lib/api/with-cron.ts',                      'WithCron'],
  ['src/lib/openapi/generator.ts',                  'OpenAPIGen'],
  ['src/lib/prompts/eval/ragas-runner.ts',           'RAGASRunner'],
  ['src/lib/prompts/registry.ts',                   'PromptRegistry'],
  ['src/lib/rag/evaluation/ragas-runner.ts',         'RAGASEval'],
  ['src/lib/rag/pipeline.ts',                       'RAGPipeline'],
  ['src/lib/stock-images/unsplash.ts',              'Unsplash'],
  ['src/lib/storage/r2.ts',                         'R2Storage'],
  ['src/lib/vector/ingestion/pipeline.ts',          'VectorIngestion'],
  ['src/lib/vector/retrieval/hybrid-search.ts',     'HybridSearch'],
  ['src/lib/workflow/saga/coordinator.ts',          'SagaCoordinator'],
  // more api routes
  ['src/app/api/accounting/payment-runs/[id]/approve/route.ts',          'payment-runs/approve'],
  ['src/app/api/accounting/year-end/[runId]/finalize/route.ts',          'year-end/finalize'],
  ['src/app/api/accounting/banks/route.ts',                              'accounting/banks'],
  ['src/app/api/inventory/route.ts',                                     'inventory'],
  ['src/app/api/fleet/route.ts',                                         'fleet'],
  ['src/app/api/real-estate/contracts/route.ts',                         'real-estate/contracts'],
  ['src/app/api/hr/performance/route.ts',                                'hr/performance'],
];

let total = 0;
for (const [rel, name] of targets) {
  total += migrateFile(rel, name);
}
console.log(`\n✅ Done. ${total} console calls migrated.`);
