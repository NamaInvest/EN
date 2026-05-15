const fs = require('fs');
let content = fs.readFileSync('src/app/api/pos/checkout/route.ts', 'utf8');

content = content.replace(
  "import { withTransaction } from '@/lib/db/transaction';",
  "import { withTransaction, runFinancialTx } from '@/lib/db/transaction';"
);

content = content.replace(
  "const invoice = await prisma.$transaction(async (tx) => {",
  "const invoice = await runFinancialTx(prisma, async (tx: any) => {"
);

// Move postSalesInvoice inside
const insideLogic = `
            // 5. Automated Global Dual-Entry Accounting (POS to Master Journal)
            try {
                await postSalesInvoice({
                    invoiceNo: newInvoice.invoiceNo,
                    subtotal: total,
                    taxValue: tax,
                    total: finalTotal,
                    paymentType: paymentMethod || 'cash',
                    splitCash: paymentMethod === 'split' ? (splitCash || 0) : 0,
                    splitCard: paymentMethod === 'split' ? (splitCard || 0) : 0,
                    userId: auth.userId,
                    branchId: undefined, 
                    discountValue: discount || 0,
                    totalCost: totalCost,
                    date: new Date().toISOString().split('T')[0],
                    txClient: tx
                });
            } catch (journalErr: unknown) {
                log.warn('Auto-journal for POS sale skipped/failed:', journalErr);
            }

            return { newInvoice, totalCost, formattedInvoiceNo };
        });`;

content = content.replace(/return \{ newInvoice, totalCost, formattedInvoiceNo \};\s*\}\);/, insideLogic);

// Remove the external postSalesInvoice
content = content.replace(/\/\/ 5\. Automated Global Dual-Entry Accounting \([\s\S]*?log\.warn\('Auto-journal for POS sale skipped\/failed:', journalErr\);\s*\}/, '');

fs.writeFileSync('src/app/api/pos/checkout/route.ts', content);
console.log('Done checkout');
