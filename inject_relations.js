const fs = require('fs');

let mergedSchema = fs.readFileSync('schema_merged.prisma', 'utf-8');
const oldSchema = fs.readFileSync('schema_old_server.prisma', 'utf-8');

const relationsToCopy = [
  { model: 'User', fields: ['branchId', 'branch', 'shifts'] },
  { model: 'SalesInvoice', fields: ['branchId', 'branch', 'zatca'] },
  { model: 'PurchaseInvoice', fields: ['branchId', 'branch'] },
  { model: 'Expense', fields: ['branchId', 'branch'] },
  { model: 'Customer', fields: ['branchId', 'branch'] },
  { model: 'Product', fields: ['recipes', 'ingredients', 'batches'] }
];

for (const relation of relationsToCopy) {
  const oldModelRegex = new RegExp(`model\\s+${relation.model}\\s+\\{([\\s\\S]*?)\\}`, 'g');
  const oldMatch = oldModelRegex.exec(oldSchema);
  
  if (oldMatch) {
    const oldLines = oldMatch[1].split('\n').filter(line => line.trim() !== '');
    const fieldsToAdd = [];
    
    for (const line of oldLines) {
      for (const field of relation.fields) {
        if (line.trim().startsWith(field + ' ') || line.trim().startsWith(field + ':')) {
          fieldsToAdd.push(line);
        }
      }
    }
    
    if (fieldsToAdd.length > 0) {
      mergedSchema = mergedSchema.replace(
        new RegExp(`(model\\s+${relation.model}\\s+\\{[\\s\\S]*?\\n)(\\})`),
        `$1${fieldsToAdd.join('\n')}\n$2`
      );
      console.log(`Added relation fields to ${relation.model}: ${relation.fields.join(', ')}`);
    }
  }
}

fs.writeFileSync('schema_final.prisma', mergedSchema);
console.log('schema_final.prisma generated with relations.');
