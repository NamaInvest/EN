const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const modelRegex = /^model\s+(\w+)\s+{([\s\S]*?)^}/gm;
let newSchema = schema;

let match;
while ((match = modelRegex.exec(schema)) !== null) {
    const modelName = match[1];
    const modelBody = match[2];
    
    // Skip models that already have tenantId
    if (modelBody.includes('tenantId')) continue;
    
    // Some models like User, Tenant, Subscription shouldn't have tenantId?
    // Wait, DB-per-tenant means we don't need tenantId. But if we are merging them, we do.
    // Let's add tenantId to all models except System models.
    const sysModels = ['Tenant', 'User', 'Session', 'SystemSetting'];
    if (sysModels.includes(modelName)) continue;

    // Inject tenantId right after the first field (usually id)
    const newBody = modelBody.replace(/(\n\s+id\s+[^\n]+)/, `$1\n  tenantId String @default("default") @map("tenant_id")`);
    
    // Replace the old model definition with the new one
    newSchema = newSchema.replace(match[0], `model ${modelName} {${newBody}}`);
}

fs.writeFileSync(path.join(__dirname, 'prisma', 'schema.prisma.new'), newSchema, 'utf8');
console.log('Schema updated with tenantId in schema.prisma.new');
