const fs = require('fs');
const path = require('path');

function getFiles(dir, filesList = []) {
  if (!fs.existsSync(dir)) return filesList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, filesList);
    } else {
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        filesList.push(filePath);
      }
    }
  }
  return filesList;
}

const apiFiles = getFiles('src/app/api');
const libFiles = getFiles('src/lib');
const allFiles = [...apiFiles, ...libFiles];

const findings = {
  prismaTransactions: [],
  journalEntryWrites: [],
  treasuryWrites: [],
  productStockWrites: [],
  stockMovementWrites: [],
  inventoryAdjustmentWrites: [],
  missingTenantId: new Set(),
  missingIdempotency: new Set(),
  mixedTransactions: [],
  globalPrismaClient: []
};

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const relPath = path.relative(process.cwd(), file);
  
  let hasFinancial = false;
  let hasInventory = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('prisma.$transaction')) findings.prismaTransactions.push(`${relPath}:${i+1}`);
    if (line.includes('journalEntry.create')) { findings.journalEntryWrites.push(`${relPath}:${i+1}`); hasFinancial = true; }
    if (line.includes('treasury.create')) { findings.treasuryWrites.push(`${relPath}:${i+1}`); hasFinancial = true; }
    
    if (line.includes('productStock.create') || line.includes('productStock.update') || 
        line.includes('productStock.upsert') || line.includes('productStock.delete')) {
        findings.productStockWrites.push(`${relPath}:${i+1}`);
        hasInventory = true;
    }
    if (line.includes('stockMovement.create')) { findings.stockMovementWrites.push(`${relPath}:${i+1}`); hasInventory = true; }
    if (line.includes('inventoryAdjustment.create')) { findings.inventoryAdjustmentWrites.push(`${relPath}:${i+1}`); hasInventory = true; }
    
    // Simplistic missing tenant isolation check
    if ((line.includes('.findMany(') || line.includes('.updateMany(') || line.includes('.deleteMany(')) && !content.includes('tenantId')) {
       findings.missingTenantId.add(relPath);
    }
  }
  
  if (hasFinancial && hasInventory && !content.includes('runFinancialTx') && !content.includes('runInventoryTx')) {
      findings.mixedTransactions.push(relPath);
  }
  
  if (relPath.includes('webhook') && !content.includes('x-idempotency-key')) {
      findings.missingIdempotency.add(relPath);
  }
}

let md = `# Nama Invest ERP - Full Architecture Scan Report\n\n`;
md += `## 1. Executive Summary\n`;
md += `This architectural scan analyzes the entire backend API (\`src/app/api\`) and core business logic (\`src/lib\`) to detect transaction boundary violations, direct database mutations, missing tenant isolation, and lack of webhook idempotency.\n\n`;

md += `## 2. Critical Risks\n`;
if (findings.prismaTransactions.length > 0) md += `- **Direct $transaction found:** Found ${findings.prismaTransactions.length} raw transaction usage(s). Should use runFinancialTx/runInventoryTx.\n`;
if (findings.mixedTransactions.length > 0) md += `- **Mixed Boundaries:** Found ${findings.mixedTransactions.length} files mixing inventory & financial without proper boundaries.\n`;
if (findings.missingIdempotency.size > 0) md += `- **Missing Idempotency:** Found ${findings.missingIdempotency.size} webhooks lacking idempotency keys.\n`;
if (findings.missingTenantId.size > 0) md += `- **Possible Tenant Leakage:** Found ${findings.missingTenantId.size} files with Many queries but no visible tenantId filtering in file context.\n\n`;

md += `## 3. Financial Domain Findings\n`;
md += `- **Journal Entries:** ${findings.journalEntryWrites.length} direct \`journalEntry.create\` calls found.\n`;
findings.journalEntryWrites.slice(0, 10).forEach(x => md += `  - ${x}\n`);
if (findings.journalEntryWrites.length > 10) md += `  - ...and ${findings.journalEntryWrites.length - 10} more.\n`;

md += `- **Treasury Writes:** ${findings.treasuryWrites.length} direct \`treasury.create\` calls found.\n`;
findings.treasuryWrites.slice(0, 10).forEach(x => md += `  - ${x}\n`);
if (findings.treasuryWrites.length > 10) md += `  - ...and ${findings.treasuryWrites.length - 10} more.\n\n`;

md += `## 4. Inventory Domain Findings\n`;
md += `- **Product Stock:** ${findings.productStockWrites.length} direct \`productStock\` mutations found.\n`;
findings.productStockWrites.slice(0, 10).forEach(x => md += `  - ${x}\n`);
if (findings.productStockWrites.length > 10) md += `  - ...and ${findings.productStockWrites.length - 10} more.\n`;

md += `- **Stock Movements:** ${findings.stockMovementWrites.length} direct \`stockMovement.create\` calls found.\n`;
findings.stockMovementWrites.slice(0, 10).forEach(x => md += `  - ${x}\n`);
if (findings.stockMovementWrites.length > 10) md += `  - ...and ${findings.stockMovementWrites.length - 10} more.\n\n`;

md += `## 5. Purchases Domain Findings\n`;
const purchasesFiles = findings.prismaTransactions.filter(f => f.includes('purchases'));
md += `- ${purchasesFiles.length} raw transactions found in Purchases.\n`;

md += `## 6. Sales/POS Domain Findings\n`;
const salesFiles = findings.prismaTransactions.filter(f => f.includes('sales') || f.includes('pos'));
md += `- ${salesFiles.length} raw transactions found in Sales/POS.\n\n`;

md += `## 7. Webhooks Findings\n`;
md += `- Webhooks without Idempotency keys:\n`;
Array.from(findings.missingIdempotency).forEach(x => md += `  - ${x}\n`);
md += `\n`;

md += `## 8. HR/Payroll/Rent Findings\n`;
const hrFiles = findings.prismaTransactions.filter(f => f.includes('hr') || f.includes('salaries') || f.includes('rent'));
md += `- ${hrFiles.length} raw transactions found in HR/Payroll/Rent.\n\n`;

md += `## 9. Tenant Isolation Findings\n`;
md += `- Suspected files with missing \`tenantId\` constraints during Many operations (${findings.missingTenantId.size}):\n`;
Array.from(findings.missingTenantId).slice(0, 15).forEach(x => md += `  - ${x}\n`);
if (findings.missingTenantId.size > 15) md += `  - ...and ${findings.missingTenantId.size - 15} more.\n\n`;

md += `## 10. Direct Prisma Usage Map\n`;
md += `- Raw \`prisma.$transaction\` occurrences (${findings.prismaTransactions.length}):\n`;
findings.prismaTransactions.slice(0, 15).forEach(x => md += `  - ${x}\n`);
if (findings.prismaTransactions.length > 15) md += `  - ...and ${findings.prismaTransactions.length - 15} more.\n\n`;

md += `## 11. Transaction Boundary Violations\n`;
md += `- Mixed Financial/Inventory operations outside Atomic Wrappers:\n`;
findings.mixedTransactions.forEach(x => md += `  - ${x}\n`);
md += `\n`;

md += `## 12. Suggested Fix Plan\n`;
md += `1. **Replace** all \`prisma.$transaction\` with \`runFinancialTx\` or \`runInventoryTx\`.\n`;
md += `2. **Extract** direct \`journalEntry.create\` into \`accounting-engine.service.ts\`.\n`;
md += `3. **Extract** direct \`stockMovement.create\` into \`inventory.service.ts\`.\n`;
md += `4. **Enforce** \`x-idempotency-key\` across all \`/api/webhooks/*\`.\n\n`;

md += `## 13. Priority Matrix\n`;
md += `- **P0 Critical:** Replace raw \`prisma.$transaction\` in active accounting endpoints.\n`;
md += `- **P0 Critical:** Add tenant isolation to missing queries.\n`;
md += `- **P1 High:** Fix idempotency on Salla/ZATCA webhooks.\n`;
md += `- **P2 Medium:** Standardize \`runInventoryTx\` across manufacturing.\n`;
md += `- **P3 Low:** Audit minor reporting queries.\n\n`;

md += `## 14. Files That Need Refactor\n`;
const refactorFiles = new Set([...findings.prismaTransactions.map(x=>x.split(':')[0]), ...findings.mixedTransactions, ...findings.missingIdempotency]);
Array.from(refactorFiles).slice(0, 15).forEach(x => md += `- ${x}\n`);
if (refactorFiles.size > 15) md += `- ...and ${refactorFiles.size - 15} more.\n\n`;

md += `## 15. Safe Execution Phases\n`;
md += `Phase 1: Webhook Idempotency Validation\n`;
md += `Phase 2: Inventory Wrapper Upgrades (\`runInventoryTx\`)\n`;
md += `Phase 3: Financial Wrapper Upgrades (\`runFinancialTx\`)\n`;
md += `Phase 4: Tenant Isolation Enforcement\n`;

fs.writeFileSync('tmp/full-architecture-scan-report.md', md, 'utf8');
console.log('Scan Complete. Report saved to tmp/full-architecture-scan-report.md');
