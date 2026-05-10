/**
 * add-compound-indexes.js
 * يُضيف @@index مركّبة على (createdAt) و (status/date) لأهم الـ models
 * يساعد على تسريع الاستعلامات الشائعة في النظام
 */
const fs   = require('fs');
const path = require('path');

const SCHEMA_PATH = path.join(process.cwd(), 'prisma', 'schema.prisma');

// الـ indexes المطلوبة: { model, fields, reason }
const INDEXES_TO_ADD = [
  // ── Sales ─────────────────────────────────────────────────────────────────
  { model: 'SalesInvoice',       fields: ['date', 'deletedAt'],      name: 'idx_sales_date_del' },
  { model: 'SalesInvoice',       fields: ['status', 'deletedAt'],    name: 'idx_sales_status_del' },
  { model: 'SalesInvoiceDetail', fields: ['invoiceId', 'deletedAt'], name: 'idx_sales_det_inv' },
  // ── Purchase ──────────────────────────────────────────────────────────────
  { model: 'PurchaseOrder',      fields: ['status', 'deletedAt'],    name: 'idx_po_status' },
  { model: 'PurchaseOrder',      fields: ['date', 'deletedAt'],      name: 'idx_po_date' },
  { model: 'PurchaseInvoice',    fields: ['date', 'deletedAt'],      name: 'idx_pi_date' },
  // ── Journal ───────────────────────────────────────────────────────────────
  { model: 'JournalEntry',       fields: ['date', 'deletedAt'],      name: 'idx_je_date' },
  { model: 'JournalEntry',       fields: ['status', 'deletedAt'],    name: 'idx_je_status' },
  { model: 'JournalLine',        fields: ['journalEntryId', 'deletedAt'], name: 'idx_jl_entry' },
  // ── Customer ──────────────────────────────────────────────────────────────
  { model: 'Customer',           fields: ['deletedAt', 'createdAt'], name: 'idx_cust_del_created' },
  // ── Product ───────────────────────────────────────────────────────────────
  { model: 'Product',            fields: ['deletedAt', 'name'],      name: 'idx_prod_name' },
  // ── Employee ──────────────────────────────────────────────────────────────
  { model: 'Employee',           fields: ['deletedAt', 'status'],    name: 'idx_emp_status' },
  // ── Treasury ──────────────────────────────────────────────────────────────
  { model: 'Treasury',           fields: ['deletedAt', 'type'],      name: 'idx_treas_type' },
  // ── Payroll ───────────────────────────────────────────────────────────────
  { model: 'PayrollInvoice',     fields: ['month', 'year'],          name: 'idx_payroll_period' },
];

let schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
let added = 0;
let skipped = 0;

for (const { model, fields, name } of INDEXES_TO_ADD) {
  // Check if this index already exists
  const indexLine = `@@index([${fields.join(', ')}]`;
  const modelRegex = new RegExp(`(model ${model} \\{)([^}]*)(\\})`, 's');
  const match = schema.match(modelRegex);

  if (!match) {
    console.log(`⚠  SKIP: model ${model} not found`);
    skipped++;
    continue;
  }

  const modelBody = match[2];

  // Check if field exists in model
  const allFieldsExist = fields.every(f => modelBody.includes(f));
  if (!allFieldsExist) {
    const missing = fields.filter(f => !modelBody.includes(f));
    console.log(`⚠  SKIP: ${model} — fields not found: ${missing.join(', ')}`);
    skipped++;
    continue;
  }

  // Check if similar index already exists
  if (modelBody.includes(`@@index([${fields.join(', ')}`) || modelBody.includes(name)) {
    console.log(`✓  SKIP: ${model} index [${fields.join(', ')}] already exists`);
    skipped++;
    continue;
  }

  // Find where to insert — before closing } but after other @@index lines
  const lastAtAt = modelBody.lastIndexOf('\n  @@');
  const bodyStart = match.index + match[1].length;

  let insertPos;
  if (lastAtAt !== -1) {
    // Find end of the last @@ directive
    const afterLastAt = modelBody.indexOf('\n', lastAtAt + 1);
    insertPos = bodyStart + (afterLastAt !== -1 ? afterLastAt : modelBody.length - 1);
  } else {
    // No @@ directives — insert before closing }
    insertPos = match.index + match[0].length - 1;
  }

  const indexDecl = `\n  @@index([${fields.join(', ')}], name: "${name}", map: "${name}")`;
  schema = schema.slice(0, insertPos) + indexDecl + schema.slice(insertPos);

  console.log(`✅ ADDED: ${model} @@index([${fields.join(', ')}])`);
  added++;
}

fs.writeFileSync(SCHEMA_PATH, schema, 'utf-8');
console.log(`\n📊 Done: ${added} indexes added, ${skipped} skipped`);
