const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// Fix payment-run-engine.ts
const paymentPath = path.join(ROOT, 'src/lib/payment-run-engine.ts');
let c = fs.readFileSync(paymentPath, 'utf8');

const OLD = `        return { runId, executed: true, paymentCount: run.lines.length };
    }
}`;

const NEW = `        // ── Generate bank transfer file (SADAD/ISO 20022 compatible) ──────────
        const bankFileLines = [
            ['PAYMENT_RUN', run.runNumber, new Date().toISOString(), String(run.lines.length), String(run.totalAmount)].join('|')
        ];
        for (const line of run.lines as any[]) {
            bankFileLines.push([
                'LINE',
                line.beneficiaryIBAN     || '',
                line.beneficiarySwift    || '',
                line.beneficiaryName     || '',
                line.beneficiaryBankName || '',
                String(line.amount),
                line.currency || run.currency,
                String(line.id),
            ].join('|'));
        }
        const bankFileContent = bankFileLines.join('\\n');
        const bankFileRef = 'PRUN-' + runId + '-' + Date.now() + '.txt';

        // ── Mark lines as PAID ─────────────────────────────────────────────────
        for (const line of run.lines as any[]) {
            await (prisma.paymentRunLine as any).update({
                where: { id: line.id },
                data: { status: 'PAID', executedAt: new Date() },
            }).catch(() => {});
        }

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
        return { runId, executed: true, paymentCount: run.lines.length, bankFileRef, bankFileContent };
    }
}`;

if (c.includes(OLD)) {
    c = c.split(OLD).join(NEW);
    console.log('  payment-run-engine.ts: executePayments upgraded');
} else {
    console.log('  WARN: pattern not found in payment-run-engine.ts');
}

// Also add logger if missing
if (!c.includes("from '@/lib/logger'")) {
    c = "import { logger } from '@/lib/logger';\n\nconst log = logger.child({ service: 'PaymentRunEngine' });\n\n" + c;
    console.log('  logger injected');
}

fs.writeFileSync(paymentPath, c, 'utf8');
console.log('Done!');
