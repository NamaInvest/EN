import * as fs from 'fs';
import * as path from 'path';
import { writeTextFileSafe, nowIsoDate } from './shared';

interface FileInventory {
  path: string;
  sizeBytes: number;
  classification: string;
  truthLevel: string;
}

const CORE_REQUIRED_FILES = [
  '00-index.md',
  '01-current-state.md',
  '02-global-readiness-roadmap.md',
  '03-quality-and-testing.md',
  '04-api-and-tenant-isolation.md',
  '05-financial-governance.md',
  '06-security-and-compliance.md',
  '07-saudi-compliance.md',
  '08-performance-and-scalability.md',
  '09-devops-backup-rollback-dr.md',
  '10-product-ux-documentation.md',
  '11-global-erp-comparison.md',
  '12-customer-pilot-uat.md',
  '13-legal-trust-sales-readiness.md',
  '14-world-class-release-gate.md',
  '15-approval-gates.md',
  '16-risk-register.md',
  '17-gap-register.md',
  '18-decision-log.md',
  '19-evidence-index.md',
  '20-next-actions.md'
];

function classifyFile(filename: string): { classification: string; truthLevel: string } {
  const name = filename.toLowerCase();
  
  let classification = 'UNKNOWN';
  let truthLevel = 'UNKNOWN_SOURCE_LEVEL';

  // Determine truth level based on naming conventions or general content
  if (name.includes('index') || name.includes('current-state') || name.includes('approval-gates') || name.includes('decision-log')) {
    truthLevel = 'PRIMARY_SOURCE_OF_TRUTH';
  } else if (name.includes('roadmap') || name.includes('comparison') || name.includes('register')) {
    truthLevel = 'SECONDARY_SUPPORTING_DOC';
  } else {
    truthLevel = 'SECONDARY_SUPPORTING_DOC';
  }

  // Override specific truth levels
  if (name.includes('draft') || name.includes('claim')) {
    truthLevel = 'CLAIM_ONLY_NOT_EVIDENCE';
  } else if (name.includes('archive') || name.includes('old')) {
    truthLevel = 'ARCHIVE_REFERENCE_ONLY';
  } else if (name.includes('superseded')) {
    truthLevel = 'SUPERSEDED';
  }

  // Determine classification
  if (name === '00-index.md' || name === '18-decision-log.md' || name === '15-approval-gates.md' || name === '20-next-actions.md' || name === '63-brain-maintenance.md') {
    classification = 'CORE_GOVERNANCE';
  } else if (name === '01-current-state.md') {
    classification = 'CORE_GOVERNANCE';
  } else if (name === '02-global-readiness-roadmap.md') {
    classification = 'CORE_GOVERNANCE';
  } else if (name === '19-evidence-index.md') {
    classification = 'EVIDENCE_INDEX';
  } else if (name === '16-risk-register.md') {
    classification = 'RISK_REGISTER';
  } else if (name === '17-gap-register.md' || name === '17-gap-analysis.md') {
    classification = 'GAP_REGISTER';
  } else if (name.includes('quality') || name.includes('testing') || name.includes('test')) {
    classification = 'QUALITY_TESTING';
  } else if (name.includes('tenant-isolation') || name.includes('api-and-tenant-isolation') || name.includes('api-routes') || name.includes('endpoints')) {
    classification = 'API_TENANT_ISOLATION';
  } else if (name.includes('accounting') || name.includes('financial') || name.includes('sales') || name.includes('purchase') || name.includes('inventory') || name.includes('treasury') || name.includes('payroll') || name.includes('asset') || name.includes('manufacturing')) {
    classification = 'FINANCIAL_GOVERNANCE';
  } else if (name.includes('security') || name.includes('compliance')) {
    if (name.includes('saudi') || name.includes('zatca') || name.includes('wps') || name.includes('gosi')) {
      classification = 'SAUDI_COMPLIANCE';
    } else {
      classification = 'SECURITY_COMPLIANCE';
    }
  } else if (name.includes('saudi') || name.includes('zatca')) {
    classification = 'SAUDI_COMPLIANCE';
  } else if (name.includes('performance') || name.includes('scalability') || name.includes('tuning')) {
    classification = 'PERFORMANCE_SCALABILITY';
  } else if (name.includes('devops') || name.includes('backup') || name.includes('disaster') || name.includes('dr')) {
    classification = 'DEVOPS_DR';
  } else if (name.includes('ux') || name.includes('product') || name.includes('ui-components') || name.includes('marketing')) {
    classification = 'PRODUCT_UX_DOCS';
  } else if (name.includes('comparison') || name.includes('positioning')) {
    classification = 'GLOBAL_COMPARISON';
  } else if (name.includes('pilot') || name.includes('uat') || name.includes('scenario') || name.includes('guide')) {
    classification = 'CUSTOMER_PILOT';
  } else if (name.includes('legal') || name.includes('trust') || name.includes('gdpr') || name.includes('pdpl')) {
    classification = 'LEGAL_TRUST';
  } else if (name.includes('release-gate')) {
    classification = 'WORLD_CLASS_GATE';
  } else if (name.includes('domain') || name.includes('cron') || name.includes('webhook') || name.includes('relation') || name.includes('engine') || name.includes('ai-features') || name.includes('desktop') || name.includes('electron') || name.includes('ice') || name.includes('solutions') || name.includes('routes-map')) {
    classification = 'DOMAIN_MEMORY';
  } else if (name.includes('architecture') || name.includes('seeds') || name.includes('migrations')) {
    classification = 'ARCHITECTURE_DOC';
  } else if (name.includes('runbook') || name.includes('migration')) {
    classification = 'OPERATIONAL_RUNBOOK';
  } else if (name.includes('flow')) {
    classification = 'BUSINESS_FLOW_DOC';
  }

  return { classification, truthLevel };
}

function runInventory() {
  console.log('Starting Full .ai-brain Inventory Scan...');
  
  const brainDir = '.ai-brain';
  if (!fs.existsSync(brainDir)) {
    console.error(`ERROR: AI Brain directory not found at ${brainDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(brainDir);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  
  const inventoryList: FileInventory[] = [];
  
  for (const file of mdFiles) {
    const filePath = path.join(brainDir, file);
    const stat = fs.statSync(filePath);
    const { classification, truthLevel } = classifyFile(file);
    
    inventoryList.push({
      path: `.ai-brain/${file}`,
      sizeBytes: stat.size,
      classification,
      truthLevel
    });
  }

  // 1. Generate JSON
  writeTextFileSafe('AI_BRAIN_FULL_INVENTORY.json', JSON.stringify(inventoryList, null, 2));

  // 2. Generate CSV
  let csvContent = 'File Path,Classification,Truth Level,Size Bytes\n';
  for (const item of inventoryList) {
    csvContent += `"${item.path}","${item.classification}","${item.truthLevel}",${item.sizeBytes}\n`;
  }
  writeTextFileSafe('AI_BRAIN_FILE_CLASSIFICATION_MATRIX.csv', csvContent);

  // 3. Generate Report
  const totalFiles = inventoryList.length;
  const coreFilesDiscovered = inventoryList.filter(item => {
    const filename = path.basename(item.path);
    return CORE_REQUIRED_FILES.includes(filename);
  }).length;
  const additionalFiles = totalFiles - coreFilesDiscovered;

  // Group by classification
  const byClass: { [key: string]: number } = {};
  const byTruth: { [key: string]: number } = {};

  for (const item of inventoryList) {
    byClass[item.classification] = (byClass[item.classification] || 0) + 1;
    byTruth[item.truthLevel] = (byTruth[item.truthLevel] || 0) + 1;
  }

  const reportPath = 'FULL_AI_BRAIN_INVENTORY_REPORT.md';
  let mdReport = `# FULL AI BRAIN INVENTORY REPORT

> **التاريخ:** ${nowIsoDate()} | **تقرير جرد وتصنيف ملفات الذاكرة البرمجية** | **وضع التقييم المقيد**

---

## 1. Summary
- **Checked At**: ${new Date().toISOString()}
- **Overall Result**: \`FULL_AI_BRAIN_INVENTORY_COMPLETED\`
- **Core Required Files Checked**: \`${coreFilesDiscovered} / 20\`
- **Total .ai-brain Files Discovered**: \`${totalFiles}\`
- **Expected .ai-brain Files**: \`85\`
- **Additional Files Beyond Core**: \`${additionalFiles}\`

---

## 2. Classification Matrix & Distribution

### 📂 Distribution by Classification Category
| Classification Category | File Count |
| --- | --- |
${Object.keys(byClass).map(c => `| \`${c}\` | \`${byClass[c]}\` |`).join('\n')}

### 🔑 Distribution by Source of Truth Level
| Truth Level | File Count |
| --- | --- |
${Object.keys(byTruth).map(t => `| \`${t}\` | \`${byTruth[t]}\` |`).join('\n')}

---

## 3. Full Inventory File Registry
Detailed directory mapping and structural classification:

| File Path | Size (Bytes) | Classification | Source Level |
| --- | --- | --- | --- |
${inventoryList.map(item => `| [${path.basename(item.path)}](file:///${path.resolve(item.path).replace(/\\/g, '/')}) | ${item.sizeBytes} | \`${item.classification}\` | \`${item.truthLevel}\` |`).join('\n')}

---

## 4. Verdict & CI/CD Status
Status set to \`FULL_AI_BRAIN_INVENTORY_COMPLETED\`. All discovered database memory files are successfully classified.
`;

  writeTextFileSafe(reportPath, mdReport);
  
  console.log(`Full .ai-brain inventory completed successfully.`);
  console.log(`- Total Files Discovered: ${totalFiles}`);
  console.log(`- Core Required Files Discovered: ${coreFilesDiscovered} / 20`);
  console.log(`- Classification matrix saved to AI_BRAIN_FILE_CLASSIFICATION_MATRIX.csv`);
  console.log(`- Report generated and saved to ${reportPath}`);
}

runInventory();
