/**
 * add-soft-deletes.js
 * يُضيف deletedAt DateTime? لكل model في القائمة الأولى بالأولوية
 * ثم يُشغّل prisma db push لكل tenant database
 */
const fs   = require('fs');
const path = require('path');

const SCHEMA_PATH = path.join(process.cwd(), 'prisma', 'schema.prisma');

// ── Models التي تحتاج soft delete (مرتّبة بالأولوية) ────────────────────────
const TARGET_MODELS = [
  // مالية حرجة
  'User',
  'JournalLine',
  'Treasury',
  'PurchaseOrder',
  'PurchaseOrderDetail',
  'PurchaseInvoiceDetail',
  'SalesInvoiceDetail',
  'InstallmentPayment',
  'EmployeeLoan',
  'PayrollInvoice',
  'PayrollInvoiceDetail',
  // تشغيلية
  'PurchaseRequisition',
  'RentInvoice',
  'RentInvoiceDetail',
  'PaymentRun',
  'PaymentRunLine',
  'PaymentTransaction',
];

const SOFT_DELETE_FIELD = `  deletedAt DateTime? // P1.2 soft-delete — do not use hard DELETE`;

function addSoftDelete(content, modelName) {
  // Find the model block
  const modelRegex = new RegExp(`(model ${modelName} \\{)([^}]*)(\\})`, 's');
  const match = content.match(modelRegex);

  if (!match) {
    console.log(`⚠  SKIP: model ${modelName} not found`);
    return content;
  }

  const modelBody = match[2];

  // Already has deletedAt?
  if (modelBody.includes('deletedAt')) {
    console.log(`✓  SKIP: ${modelName} already has deletedAt`);
    return content;
  }

  // Find the last field line (before @@map, @@index, or closing })
  // Insert deletedAt just before the first @@ directive or end of fields
  const insertBefore = modelBody.match(/\n(\s+@@|\s*$)/);
  let insertPoint;

  if (insertBefore) {
    const idx = match.index + match[1].length + modelBody.lastIndexOf(insertBefore[0]);
    insertPoint = match.index + match[1].length + modelBody.indexOf(insertBefore[0]);
  } else {
    // Insert just before closing brace
    insertPoint = match.index + match[0].lastIndexOf('}');
  }

  // Find right insertion point — before first @@ or before }
  const beforeAt = modelBody.search(/\n\s+@@/);
  const bodyStart = match.index + match[1].length;

  let relativeInsert;
  if (beforeAt !== -1) {
    relativeInsert = bodyStart + beforeAt;
  } else {
    // before the }
    relativeInsert = match.index + match[0].length - 1;
  }

  const newContent =
    content.slice(0, relativeInsert) +
    `\n${SOFT_DELETE_FIELD}` +
    content.slice(relativeInsert);

  console.log(`✅ ADDED: ${modelName}.deletedAt`);
  return newContent;
}

// ── Main ─────────────────────────────────────────────────────────────────────
let schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
let added = 0;
let skipped = 0;

for (const model of TARGET_MODELS) {
  const before = schema;
  schema = addSoftDelete(schema, model);
  if (schema !== before) added++;
  else skipped++;
}

fs.writeFileSync(SCHEMA_PATH, schema, 'utf-8');

console.log(`\n📊 Done: ${added} fields added, ${skipped} skipped`);
console.log('\nNext steps:');
console.log('  npx prisma format');
console.log('  DATABASE_URL="..." npx prisma db push --skip-generate');
