const fs = require('fs');
let content = fs.readFileSync('src/app/api/pos/route.ts', 'utf8');

content = content.replace(
  "import { withTransaction } from '@/lib/db/transaction';",
  "import { withTransaction, runFinancialTx } from '@/lib/db/transaction';"
);

content = content.replace(
  "const result = await prisma.$transaction(async (tx: any) => {",
  "const result = await runFinancialTx(prisma, async (tx: any) => {"
);

content = content.replace(
  /await tx\.treasury\.create\(\{\s*data: \{\s*type:\s*'in',\s*amount:\s*total,\s*description: \`تحصيل \$\{paymentType === 'cash' \? 'نقدي' : 'شبكة'\} - فاتورة POS #\$\{invoice\.invoiceNo\}\`,\s*referenceType:\s*'sale',\s*referenceId:\s*invoice\.id,\s*userId:\s*userId \|\| null,\s*\}\s*\}\);/,
  `const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');
                await TreasuryPostingService.createTreasuryEntry(tx, {
                    type: 'in',
                    amount: total,
                    description: \`تحصيل \${paymentType === 'cash' ? 'نقدي' : 'شبكة'} - فاتورة POS #\${invoice.invoiceNo}\`,
                    referenceType: 'sale',
                    referenceId: invoice.id,
                }, userId || null);`
);

content = content.replace(
  /await tx\.treasury\.create\(\{\s*data: \{ type: 'in', amount: sCash, description: \`تحصيل نقدي - فاتورة POS #\$\{invoice\.invoiceNo\}\`, referenceType: 'sale', referenceId: invoice\.id, userId: userId \|\| null \},\s*\}\);/,
  `const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');
                    await TreasuryPostingService.createTreasuryEntry(tx, { type: 'in', amount: sCash, description: \`تحصيل نقدي - فاتورة POS #\${invoice.invoiceNo}\`, referenceType: 'sale', referenceId: invoice.id }, userId || null);`
);

content = content.replace(
  /await tx\.treasury\.create\(\{\s*data: \{ type: 'in', amount: sCard, description: \`مسدد بالشبكة - فاتورة POS #\$\{invoice\.invoiceNo\}\`, referenceType: 'sale', referenceId: invoice\.id, userId: userId \|\| null \},\s*\}\);/,
  `const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');
                    await TreasuryPostingService.createTreasuryEntry(tx, { type: 'in', amount: sCard, description: \`مسدد بالشبكة - فاتورة POS #\${invoice.invoiceNo}\`, referenceType: 'sale', referenceId: invoice.id }, userId || null);`
);

fs.writeFileSync('src/app/api/pos/route.ts', content);
console.log('Done pos');
