const fs = require('fs');
let schema = fs.readFileSync('schema_final_fixed.prisma', 'utf-8');

const additions = [
  { model: 'Stock',         fields: ['  branchId Int? @map("branch_id")'] },
  { model: 'SalesReturn',   fields: ['  branchId Int? @map("branch_id")', '  shiftId  Int? @map("shift_id")'] },
  { model: 'Treasury',      fields: ['  branchId Int? @map("branch_id")'] },
  { model: 'JournalEntry',  fields: ['  branchId Int? @map("branch_id")'] },
  { model: 'SalesInvoiceDetail', fields: ['  batchId Int? @map("batch_id")'] },
  { model: 'StockMovement', fields: ['  batchId Int? @map("batch_id")'] }
];

for (const add of additions) {
  const modelRegex = new RegExp(`(model\\s+${add.model}\\s+\\{[\\s\\S]*?\\n)(\\})`);
  schema = schema.replace(modelRegex, `$1${add.fields.join('\n')}\n$2`);
  console.log(`Added scalar fields to ${add.model}`);
}

fs.writeFileSync('schema_ready.prisma', schema);
console.log('schema_ready.prisma generated!');
