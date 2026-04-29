const fs = require('fs');

let schema = fs.readFileSync('schema_final.prisma', 'utf-8');

const additions = [
  {
    model: 'Stock',
    fields: ['  branch   Branch? @relation(fields: [branchId], references: [id])']
  },
  {
    model: 'SalesReturn',
    fields: [
      '  branch   Branch? @relation(fields: [branchId], references: [id])',
      '  shift    Shift?  @relation(fields: [shiftId], references: [id])'
    ]
  },
  {
    model: 'Treasury',
    fields: ['  branch   Branch?  @relation(fields: [branchId], references: [id])']
  },
  {
    model: 'JournalEntry',
    fields: ['  branch   Branch?  @relation(fields: [branchId], references: [id])']
  },
  {
    model: 'SalesInvoice',
    fields: ['  shift    Shift?   @relation(fields: [shiftId], references: [id])']
  },
  // the Product model has multiple opposites expected
  // 'finishedProduct Product @relation("RecipeFinishedProduct"...)'
  // 'rawProduct Product @relation("RecipeRawProduct"...)'
];

// we can also just append missing fields at the end of each model block using string replacement
for (const add of additions) {
  const modelRegex = new RegExp(`(model\\s+${add.model}\\s+\\{[\\s\\S]*?\\n)(\\})`);
  schema = schema.replace(modelRegex, `$1${add.fields.join('\n')}\n$2`);
  console.log(`Updated model ${add.model}`);
}

// Special case for Product because of relation names:
const productRegex = /(model\s+Product\s+\{[\s\S]*?\n)(\})/;
const productFields = [
  '  finishedRecipes Recipe[]             @relation("RecipeFinishedProduct")',
  '  rawRecipes      RecipeIngredient[]   @relation("RecipeRawProduct")'
];
schema = schema.replace(productRegex, `$1${productFields.join('\n')}\n$2`);
console.log('Updated model Product');

// Special case for SalesInvoiceDetail missing from ProductBatch
const salesInvDetailRegex = /(model\s+SalesInvoiceDetail\s+\{[\s\S]*?\n)(\})/;
const salesInvDetailFields = [
  '  batch   ProductBatch? @relation(fields: [batchId], references: [id])'
];
schema = schema.replace(salesInvDetailRegex, `$1${salesInvDetailFields.join('\n')}\n$2`);
console.log('Updated model SalesInvoiceDetail');

// Special case for StockMovement missing from ProductBatch
const stockMovementRegex = /(model\s+StockMovement\s+\{[\s\S]*?\n)(\})/;
const stockMovementFields = [
  '  batch   ProductBatch? @relation(fields: [batchId], references: [id])'
];
schema = schema.replace(stockMovementRegex, `$1${stockMovementFields.join('\n')}\n$2`);
console.log('Updated model StockMovement');


fs.writeFileSync('schema_final_fixed.prisma', schema);
console.log('schema_final_fixed.prisma generated!');
