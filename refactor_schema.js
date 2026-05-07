const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const decimalFields = [
    'buyPrice', 'sellPrice', 'taxRate', 'minQuantity', 'currentStock',
    'taxValue', 'total', 'restockingFee', 'quantity', 'price',
    'discountRate', 'discountValue', 'subtotal', 'amount', 'balance', 'value', 'salary'
];

let newSchema = schema;

// Replace Float with Decimal for financial fields
for (const field of decimalFields) {
    const regex = new RegExp(`(\\b${field}\\s+)Float(\\?|\\s+)`, 'g');
    newSchema = newSchema.replace(regex, `$1Decimal$2`);
}

// Ensure default values are converted from @default(0) to @default(0.0) or removed since Prisma Decimal defaults are usually strings or specific types. Actually @default(0) works fine for Decimal in Prisma.

const modelRegex = /^model\s+(\w+)\s+{([\s\S]*?)^}/gm;
let finalSchema = newSchema;

let match;
while ((match = modelRegex.exec(newSchema)) !== null) {
    const modelName = match[1];
    const modelBody = match[2];
    
    // Skip models that already have tenantId
    if (modelBody.includes('tenantId')) continue;
    
    // Skip system models
    const sysModels = ['Tenant', 'User', 'Session', 'SystemSetting'];
    if (sysModels.includes(modelName)) continue;

    // Inject tenantId right after the first field (usually id)
    const newBody = modelBody.replace(/(\n\s+id\s+[^\n]+)/, `$1\n  tenantId String @default("default") @map("tenant_id")`);
    
    // Replace the old model definition with the new one
    finalSchema = finalSchema.replace(match[0], `model ${modelName} {${newBody}}`);
}

fs.writeFileSync(schemaPath, finalSchema, 'utf8');
console.log('Schema updated with tenantId and Decimal types in schema.prisma');
