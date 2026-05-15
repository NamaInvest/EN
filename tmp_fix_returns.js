const fs = require('fs');
let content = fs.readFileSync('src/app/api/sales-returns/route.ts', 'utf8');

content = content.replace(
  "import { withTransaction } from '@/lib/db/transaction';",
  "import { withTransaction, runFinancialTx } from '@/lib/db/transaction';"
);

content = content.replace(
  "const salesReturn = await prisma.$transaction(async (tx) => {",
  "const salesReturn = await runFinancialTx(prisma, async (tx: any) => {"
);

content = content.replace(
  /await tx\.treasury\.create\(\{\s*data: \{\s*type:\s*'out',\s*amount:\s*total,\s*description:\s*(.+?),\s*referenceType:\s*'salesReturn',\s*referenceId:\s*ret\.id,\s*userId:\s*auth\?\.userId \|\| null,\s*branchId:\s*body\.branchId \|\| null,\s*\},\s*\}\);/,
  `const { TreasuryPostingService } = await import('@/lib/services/treasury-posting.service');
      await TreasuryPostingService.createTreasuryEntry(tx, {
          type: 'out',
          amount: total,
          description: $1,
          referenceType: 'salesReturn',
          referenceId: ret.id,
      }, auth?.userId || null, body.branchId || null);`
);

fs.writeFileSync('src/app/api/sales-returns/route.ts', content);
console.log('Done sales-returns');
