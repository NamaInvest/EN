const fs = require('fs');
let content = fs.readFileSync('src/app/api/sales/route.ts', 'utf8');

content = content.replace(/if \(sCash > 0\) \{\s+await tx\.treasury\.create\(\{[\s\S]*?\}\);\s+\}/,
`if (sCash > 0) {
                        const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');
                        await TreasuryPostingService.createTreasuryEntry(tx, { type: 'in', amount: sCash, description: \`تحصيل نقدي - فاتورة مبيعات #\${invoiceNo}\`, referenceType: 'sale', referenceId: createdInvoice.id }, userId, branchId);
                    }`);

content = content.replace(/if \(sCard > 0\) \{\s+await tx\.treasury\.create\(\{[\s\S]*?\}\);\s+\}/,
`if (sCard > 0) {
                        const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');
                        await TreasuryPostingService.createTreasuryEntry(tx, { type: 'in', amount: sCard, description: \`مسدد بالشبكة - فاتورة مبيعات #\${invoiceNo}\`, referenceType: 'sale', referenceId: createdInvoice.id }, userId, branchId);
                    }`);

content = content.replace(/await tx\.treasury\.create\(\{\s+data: \{\s+type: 'in',\s+amount: paid,[\s\S]*?branchId,\s+\},\s+\}\);/,
`const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');
                    await TreasuryPostingService.createTreasuryEntry(tx, {
                            type: 'in',
                            amount: paid,
                            description: \`فاتورة مبيعات #\${invoiceNo}\`,
                            referenceType: 'sale',
                            referenceId: createdInvoice.id,
                        }, userId, branchId);`);

content = content.replace(/const treasuryRec = await tx\.treasury\.create\(\{\s+data: \{\s+type: 'in',\s+amount: payAmount,[\s\S]*?branchId,\s+\},\s+\}\);/,
`const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');
            const treasuryRec = await TreasuryPostingService.createTreasuryEntry(tx, {
                    type: 'in',
                    amount: payAmount,
                    description: \`تحصيل دفعة - فاتورة مبيعات #\${invoice.invoiceNo}\`,
                    referenceType: 'sale_payment',
                    referenceId: invoice.id,
                }, parsedUserId, branchId);`);

fs.writeFileSync('src/app/api/sales/route.ts', content);
console.log('Done replacement');
