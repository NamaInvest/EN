const fs = require('fs');

const oldSchema = fs.readFileSync('schema_old_server.prisma', 'utf-8');
const newSchema = fs.readFileSync('schema_new_server.prisma', 'utf-8');

// The models we want to copy from the old schema
const modelsToCopy = [
  'Branch',
  'Shift',
  'Company',
  'FixedAsset',
  'Depreciation',
  'Recipe',
  'RecipeIngredient',
  'ManufacturingOrder',
  'BankAccount',
  'BankTransaction',
  'ProductBatch',
  'ZatcaSetting'
];

let mergedSchema = newSchema;

// Process each model and copy block
for (const model of modelsToCopy) {
  const modelRegex = new RegExp(`model\\s+${model}\\s+\\{[\\s\\S]*?\\n\\}`, 'g');
  const match = oldSchema.match(modelRegex);
  
  if (match) {
    if (!mergedSchema.includes(`model ${model} {`)) {
      mergedSchema += '\n\n' + match[0];
      console.log(`Copied model ${model}`);
    } else {
      console.log(`Model ${model} already exists in new schema.`);
    }
  } else {
    console.log(`Model ${model} not found in old schema.`);
  }
}

// Now we need to manually add the missing relation fields to existing models in newSchema
// like adding `branchId` to `User` if it exists in oldSchema.
const relationUpdates = [
  { model: 'User', fields: ['branchId', 'branch', 'shifts'] },
  { model: 'SalesInvoice', fields: ['branchId', 'branch', 'zatca'] },
  { model: 'PurchaseInvoice', fields: ['branchId', 'branch'] },
  { model: 'Expense', fields: ['branchId', 'branch'] },
  { model: 'Product', fields: ['recipes', 'ingredients', 'batches'] },
  { model: 'Customer', fields: ['branchId', 'branch'] }
];

// Simple manual merge for relations is tricky, let's write the models to a file and I will manually check them.
fs.writeFileSync('schema_merged.prisma', mergedSchema);
console.log('schema_merged.prisma generated. Please review diff manually for relation fields.');
