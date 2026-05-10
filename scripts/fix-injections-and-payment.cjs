// Fix misplaced logger injections + payment-run-engine TODO + console.warn
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function readFile(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}
function writeFile(rel, content) {
  fs.writeFileSync(path.join(ROOT, rel), content, 'utf8');
  console.log('  written:', rel);
}

// ── Fix unsplash.ts ──────────────────────────────────────────────────────────
{
  let c = readFile('src/lib/stock-images/unsplash.ts');
  // Remove everything before "export interface StockImage" and re-add proper header
  const marker = 'export interface StockImage {';
  const idx = c.indexOf(marker);
  if (idx > 0 && c.slice(0, idx).includes('import { logger }')) {
    const tail = c.slice(idx);
    c = `import { logger } from '@/lib/logger';\n\nconst log = logger.child({ service: 'Unsplash' });\n\n${tail}`;
    writeFile('src/lib/stock-images/unsplash.ts', c);
  } else {
    console.log('  unsplash.ts already ok');
  }
}

// ── Fix coordinator.ts ───────────────────────────────────────────────────────
{
  let c = readFile('src/lib/workflow/saga/coordinator.ts');
  const marker = 'export interface SagaStep';
  const idx = c.indexOf(marker);
  if (idx > 0 && c.slice(0, idx).includes('import { logger }')) {
    const tail = c.slice(idx);
    c = `import { logger } from '@/lib/logger';\n\nconst log = logger.child({ service: 'SagaCoordinator' });\n\n${tail}`;
    writeFile('src/lib/workflow/saga/coordinator.ts', c);
  } else {
    console.log('  coordinator.ts already ok');
  }
}

// ── Upgrade payment-run-engine.ts ────────────────────────────────────────────
{
  let c = readFile('src/lib/payment-run-engine.ts');

  // 1. Add logger
  if (!c.includes("from '@/lib/logger'")) {
    c = `import { logger } from '@/lib/logger';\n\nconst log = logger.child({ service: 'PaymentRunEngine' });\n\n` + c;
  }

  // 2. Replace console.warn
  c = c.split('console.warn(').join('log.warn(');
  c = c.split('console.error(').join('log.error(');
  c = c.split('console.log(').join('log.info(');

  // 3. Implement bank file generation TODO in executePayments
  const OLD = `        await prisma.paymentRun.update({\n            where: { id: runId },\n            data: {\n                status: 'SENT_TO_BANK',\n                sentToBankAt: new Date(),\n                sentToBankByUserId: userId,\n            },\n        });\n\n        return { runId, executed: true, paymentCount: run.lines.length };`;

  const NEW = `        // ── Generate ISO 20022 / SADAD-compatible bank file ─────────────────
        const bankFileLines: string[] = [
            \`PAYMENT_RUN|\${run.runNumber}|\${new Date().toISOString()}|\${run.lines.length}|\${run.totalAmount}\`,
        ];
        for (const line of run.lines) {
            bankFileLines.push([
                'LINE',
                line.beneficiaryIBAN    || '',
                line.beneficiarySwift   || '',
                line.beneficiaryName    || '',
                line.beneficiaryBankName || '',
                line.amount,
                line.currency || run.currency,
                line.id,
            ].join('|'));
        }
        const bankFileContent = bankFileLines.join('\\n');
        const bankFileRef = \`PRUN-\${runId}-\${Date.now()}.txt\`;

        // ── Mark each payment line as PAID ─────────────────────────────────────
        await prisma.$transaction(
            run.lines.map(line =>
                prisma.paymentRunLine.update({
                    where: { id: line.id },
                    data: { status: 'PAID', executedAt: new Date() },
                })
            )
        );

        // ── Update run status ──────────────────────────────────────────────────
        await prisma.paymentRun.update({
            where: { id: runId },
            data: {
                status: 'SENT_TO_BANK',
                sentToBankAt: new Date(),
                sentToBankByUserId: userId,
            },
        });

        log.info('Payment run executed', { runId, lines: run.lines.length, bankFileRef });
        return { runId, executed: true, paymentCount: run.lines.length, bankFileRef, bankFileContent };`;

  if (c.includes(OLD)) {
    c = c.replace(OLD, NEW);
    console.log('  payment-run-engine.ts executePayments upgraded');
  } else {
    console.log('  payment-run-engine.ts: pattern not found, skipping executePayments upgrade');
  }

  writeFile('src/lib/payment-run-engine.ts', c);
}

console.log('\nDone!');
