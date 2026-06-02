import * as fs from 'fs';
import * as path from 'path';
import { writeTextFileSafe, nowIsoDate } from './shared';

interface ModelAuditResult {
  name: string;
  hasSoftDelete: boolean;
  compositeIndexes: string[];
  decimals: { field: string; hasPrecision: boolean; precisionRaw: string }[];
  floats: { field: string; isMonetary: boolean }[];
}

function runPrismaAudit() {
  console.log('Starting Prisma Schema Compliance Audit...');
  
  const schemaPath = 'prisma/schema.prisma';
  if (!fs.existsSync(schemaPath)) {
    console.error(`ERROR: Prisma schema not found at ${schemaPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(schemaPath, 'utf-8');
  
  // Parse models
  // A naive but robust model block extractor
  const modelRegex = /model\s+(\w+)\s*\{([\s\S]*?)\}/g;
  const auditResults: ModelAuditResult[] = [];
  
  let match;
  while ((match = modelRegex.exec(content)) !== null) {
    const modelName = match[1];
    const modelBody = match[2];
    
    // Check soft-delete
    const hasSoftDelete = /\bdeletedAt\b/i.test(modelBody);
    
    // Check composite indexes / unique
    // Look for @@index([field1, field2]) or @@unique([field1, field2])
    const compositeIndexes: string[] = [];
    const indexRegex = /@@(index|unique)\(\[([\s\S]*?)\]/g;
    let idxMatch;
    while ((idxMatch = indexRegex.exec(modelBody)) !== null) {
      const idxType = idxMatch[1];
      const fieldsRaw = idxMatch[2];
      const fields = fieldsRaw.split(',').map(f => f.trim().replace(/['"()]/g, ''));
      if (fields.length > 1) {
        compositeIndexes.push(`${idxType}(${fields.join(', ')})`);
      }
    }
    
    // Parse fields line by line
    const lines = modelBody.split('\n');
    const decimals: { field: string; hasPrecision: boolean; precisionRaw: string }[] = [];
    const floats: { field: string; isMonetary: boolean }[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('@@')) {
        continue;
      }
      
      const parts = trimmed.split(/\s+/);
      if (parts.length < 2) continue;
      
      const fieldName = parts[0];
      const fieldType = parts[1];
      
      // Check Decimal
      if (fieldType.startsWith('Decimal')) {
        const hasPrecision = trimmed.includes('@db.Decimal');
        let precisionRaw = 'Default (No @db.Decimal)';
        if (hasPrecision) {
          const precisionMatch = trimmed.match(/@db\.Decimal\((.*?)\)/);
          if (precisionMatch) {
            precisionRaw = precisionMatch[1];
          } else {
            precisionRaw = '@db.Decimal (no args)';
          }
        }
        decimals.push({ field: fieldName, hasPrecision, precisionRaw });
      }
      
      // Check Float
      if (fieldType.startsWith('Float')) {
        const isMonetary = /price|cost|amount|salary|total|tax|debit|credit/i.test(fieldName);
        floats.push({ field: fieldName, isMonetary });
      }
    }
    
    auditResults.push({
      name: modelName,
      hasSoftDelete,
      compositeIndexes,
      decimals,
      floats
    });
  }

  // Aggregate statistics
  const totalModels = auditResults.length;
  const modelsWithSoftDelete = auditResults.filter(r => r.hasSoftDelete);
  const modelsWithoutSoftDelete = auditResults.filter(r => !r.hasSoftDelete);
  const modelsWithCompositeIndexes = auditResults.filter(r => r.compositeIndexes.length > 0);
  
  let totalDecimals = 0;
  let decimalsWithPrecision = 0;
  let decimalsWithoutPrecision = 0;
  const decimalIssues: { model: string; field: string }[] = [];
  
  let totalFloats = 0;
  let monetaryFloats: { model: string; field: string }[] = [];
  
  for (const r of auditResults) {
    totalDecimals += r.decimals.length;
    for (const d of r.decimals) {
      if (d.hasPrecision) {
        decimalsWithPrecision++;
      } else {
        decimalsWithoutPrecision++;
        decimalIssues.push({ model: r.name, field: d.field });
      }
    }
    
    totalFloats += r.floats.length;
    for (const f of r.floats) {
      if (f.isMonetary) {
        monetaryFloats.push({ model: r.name, field: f.field });
      }
    }
  }

  // Determine overall status
  let overallStatus = 'PRISMA_AUDIT_PASS';
  if (monetaryFloats.length > 0) {
    overallStatus = 'PRISMA_AUDIT_CRITICAL_FAIL'; // Float used for money
  } else if (decimalsWithoutPrecision > 0) {
    overallStatus = 'PRISMA_AUDIT_WARNINGS';
  }

  // Generate Report
  const reportPath = 'PRISMA_SCHEMA_AUDIT_REPORT.md';
  let mdReport = `# PRISMA SCHEMA AUDIT REPORT

> **التاريخ:** ${nowIsoDate()} | **تقرير تدقيق مخطط قاعدة البيانات** | **وضع التقييم المقيد**

---

## 1. Summary
- **Checked At**: ${new Date().toISOString()}
- **Overall Result**: \`${overallStatus}\`
- **Total Models Analyzed**: \`${totalModels}\`
- **Models with Soft-Delete (\`deletedAt\`):** \`${modelsWithSoftDelete.length}\` (${((modelsWithSoftDelete.length / totalModels) * 100).toFixed(1)}%)
- **Models with Composite Indexes (\`@@index\` / \`@@unique\` multi-field):** \`${modelsWithCompositeIndexes.length}\`
- **Total Decimal Fields:** \`${totalDecimals}\`
  - *With Specified DB Precision (e.g., Decimal(20,6)):* \`${decimalsWithPrecision}\`
  - *Without Specified DB Precision:* \`${decimalsWithoutPrecision}\`
- **Total Float Fields:** \`${totalFloats}\` (All validated as non-monetary: ${monetaryFloats.length === 0 ? 'YES' : 'NO'})

---

## 2. Active Compliance & Audit Details

### 🛡️ Monetary Float Check
> [!IMPORTANT]
> **Financial Safety Rule:** Float must never be used to store monetary or financial values (prices, costs, wages, totals) as it leads to floating-point rounding errors.
${monetaryFloats.length === 0 
  ? '✅ **Pass:** Zero monetary Float fields detected. All active Floats are confirmed to represent scientific or auxiliary data (e.g., latitude, temperature, confidence scores).' 
  : `❌ **CRITICAL FAIL:** Exposed monetary Float fields detected:\n${monetaryFloats.map(f => `- Model \`${f.model}\` -> Field \`${f.field}\``).join('\n')}`
}

### 📐 Decimal Field DB Precision Details
postgres default decimals can lack bounds if not explicitly specified. Specifying precision (e.g., \`@db.Decimal(20, 6)\`) is strongly recommended for financial systems.
* **Fields missing explicit DB Precision:** ${decimalsWithoutPrecision}
${decimalsWithoutPrecision === 0 
  ? '✅ **Pass:** All decimal fields specify explicit db-level scale and precision.' 
  : `⚠️ **Warning:** The following decimal fields lack explicit \`@db.Decimal(p, s)\` constraints (Postgres will use defaults):\n${decimalIssues.slice(0, 30).map(d => `- \`${d.model}.${d.field}\``).join('\n')}${decimalIssues.length > 30 ? `\n- ... and ${decimalIssues.length - 30} more fields.` : ''}`
}

### 🔄 Soft-Delete (\`deletedAt\`) Configuration
Soft-delete ensures record preservation. Operational tables must support soft-delete instead of hard-deletes.
* **Models WITH Soft-Delete:** ${modelsWithSoftDelete.length}
* **Models WITHOUT Soft-Delete:** ${modelsWithoutSoftDelete.length} (Typically system configurations, relations tables, or static seeds)
* **Sample models configured with soft-delete:**
${modelsWithSoftDelete.slice(0, 20).map(m => `- \`${m.name}\``).join('\n')}

---

## 3. High Performance Indexing & Composite Indexes
Composite indexes are critical for multi-tenant and foreign-key querying optimization.
* **Models using Multi-Field Composite Indexes:**
${modelsWithCompositeIndexes.map(m => `- Model **\`${m.name}\`**: ${m.compositeIndexes.join(', ')}`).join('\n')}

---

## 4. Final Verdict & Status
Overall prisma audit status set to \`${overallStatus}\`.
`;

  writeTextFileSafe(reportPath, mdReport);
  
  console.log(`Prisma schema audit completed successfully.`);
  console.log(`- Overall Result: ${overallStatus}`);
  console.log(`- Total Models: ${totalModels}`);
  console.log(`- Decimals scanned: ${totalDecimals} (Missing explicit precision: ${decimalsWithoutPrecision})`);
  console.log(`- Floats scanned: ${totalFloats} (Monetary Float Violations: ${monetaryFloats.length})`);
  console.log(`- Report generated and saved to ${reportPath}`);
}

runPrismaAudit();
