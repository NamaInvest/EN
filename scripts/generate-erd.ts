import fs from 'fs';
import path from 'path';

const SCHEMA_PATH = path.join(process.cwd(), 'prisma/schema.prisma');
const ERD_OUT_DIR = path.join(process.cwd(), 'docs/database/erd');
const MODULES_DIR = path.join(ERD_OUT_DIR, 'modules');

// Ensure directories exist
if (!fs.existsSync(ERD_OUT_DIR)) fs.mkdirSync(ERD_OUT_DIR, { recursive: true });
if (!fs.existsSync(MODULES_DIR)) fs.mkdirSync(MODULES_DIR, { recursive: true });

// Read Schema
const schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');

// Data structures
type Field = {
  name: string;
  type: string;
  isList: boolean;
  isOptional: boolean;
  isId: boolean;
  isUnique: boolean;
  relationName?: string;
  relationFields?: string[];
  relationReferences?: string[];
  hasTenantId?: boolean;
};

type Model = {
  name: string;
  fields: Field[];
  isTenantScoped: boolean;
  domain: string;
  raw: string;
};

// Domain categorization rules
const DOMAINS = [
  { name: 'tenant-security', match: /Tenant|User|Role|Permission|Session|ApiKey|Subscription/i },
  { name: 'hr-payroll', match: /Employee|Payroll|Attendance|Salary|Leave|Department|Job|Shift|Allowance|Deduction|Overtime|GOSI|WPS/i },
  { name: 'manufacturing', match: /Production|Scrap|Bom|WorkOrder|Machine|Routing|Material|BillOfMaterial/i },
  { name: 'treasury', match: /Cheque|Cash|Deposit|Withdrawal|Bank|PaymentMethod|Treasury/i },
  { name: 'assets', match: /Asset|Depreciation|Maintenance/i },
  { name: 'procurement', match: /Purchase|Vendor|Supplier|Grn|Rfq/i },
  { name: 'sales', match: /Invoice|Quotation|Customer|Pos|Receipt|Order|Sales|Return/i },
  { name: 'inventory', match: /Stock|Item|Warehouse|Category|Unit|Batch|Barcode|Movement|Adjustment|Inventory/i },
  { name: 'ai-rag', match: /Vector|Ai|Embedding|Prompt|Chat|Message/i },
  { name: 'accounting', match: /Journal|Fiscal|Account|Payment|Ledger|Tax|Currency|Expense|Revenue/i },
  { name: 'core', match: /.*/ } // Fallback
];

function determineDomain(modelName: string): string {
  for (const domain of DOMAINS) {
    if (domain.match.test(modelName)) {
      return domain.name;
    }
  }
  return 'core';
}

function parseModels(schema: string): Model[] {
  const models: Model[] = [];
  const modelRegex = /model\s+([A-Za-z0-9_]+)\s+{([^}]+)}/g;
  
  let match;
  while ((match = modelRegex.exec(schema)) !== null) {
    const modelName = match[1];
    const body = match[2];
    
    const fields: Field[] = [];
    const lines = body.split('\n');
    let isTenantScoped = false;
    
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('//') || line.startsWith('@@')) {
        continue;
      }
      
      const parts = line.split(/\s+/);
      if (parts.length < 2) continue;
      
      const name = parts[0];
      const typeStr = parts[1];
      
      const isList = typeStr.endsWith('[]');
      const isOptional = typeStr.endsWith('?');
      const baseType = typeStr.replace('[]', '').replace('?', '');
      
      const isId = line.includes('@id');
      const isUnique = line.includes('@unique');
      
      if (name === 'tenantId') {
        isTenantScoped = true;
      }
      
      let relationName, relationFields, relationReferences;
      const relationMatch = line.match(/@relation\(([^)]+)\)/);
      if (relationMatch) {
        const relStr = relationMatch[1];
        
        const nameMatch = relStr.match(/"([^"]+)"/);
        if (nameMatch && !relStr.startsWith('fields:')) relationName = nameMatch[1];
        
        const fieldsMatch = relStr.match(/fields:\s*\[([^\]]+)\]/);
        if (fieldsMatch) relationFields = fieldsMatch[1].split(',').map(s => s.trim());
        
        const refMatch = relStr.match(/references:\s*\[([^\]]+)\]/);
        if (refMatch) relationReferences = refMatch[1].split(',').map(s => s.trim());
      }
      
      fields.push({
        name,
        type: baseType,
        isList,
        isOptional,
        isId,
        isUnique,
        relationName,
        relationFields,
        relationReferences
      });
    }
    
    models.push({
      name: modelName,
      fields,
      isTenantScoped,
      domain: determineDomain(modelName),
      raw: match[0]
    });
  }
  
  return models;
}

const models = parseModels(schemaContent);
const modelNames = new Set(models.map(m => m.name));

function generateDBML(modelsToRender: Model[], isMaster: boolean = false): string {
  let dbml = '';
  
  // Note on header
  if (isMaster) {
    dbml += `// Master ERD for Nama Invest ERP\n// Total Models: ${modelsToRender.length}\n\n`;
  }
  
  // Render tables
  for (const model of modelsToRender) {
    const notes = model.isTenantScoped ? `Note: 'TENANT SCOPED'` : '';
    dbml += `Table ${model.name} {\n`;
    
    for (const field of model.fields) {
      // Is it a relation field? DBML defines relations separately.
      // But we must list the fields. If it's an object type (points to another model), 
      // we might just skip it or include it as a generic type.
      if (modelNames.has(field.type)) {
        // This is a navigation property, ignore in Table columns for DBML
        continue;
      }
      
      let attrs = [];
      if (field.isId) attrs.push('primary key');
      if (field.isUnique) attrs.push('unique');
      if (!field.isOptional) attrs.push('not null');
      if (field.name === 'tenantId') attrs.push("note: 'Tenant Isolation'");
      
      // Highlight sensitive accounts
      if (['AR', 'AP', 'Inventory', 'Revenue', 'Expense', 'GRIR'].some(s => field.name.toLowerCase().includes(s.toLowerCase()))) {
         attrs.push("note: 'Sensitive Financial Field'");
      }
      
      const attrStr = attrs.length > 0 ? ` [${attrs.join(', ')}]` : '';
      dbml += `  ${field.name} ${field.type}${attrStr}\n`;
    }
    
    if (notes) {
      dbml += `  Note: '''${notes}'''\n`;
    }
    
    dbml += `}\n\n`;
  }
  
  // Render relations
  const renderedRels = new Set();
  
  for (const model of modelsToRender) {
    for (const field of model.fields) {
      if (modelNames.has(field.type) && field.relationFields && field.relationReferences) {
        // Model has a relation
        const targetModel = field.type;
        // If master, render all. If specific domain, only render if target is also in modelsToRender to avoid broken links
        if (isMaster || modelsToRender.find(m => m.name === targetModel)) {
          const relType = field.isList ? '<' : '-'; // many-to-one or one-to-one (simplified)
          
          for (let i = 0; i < field.relationFields.length; i++) {
            const sourceField = field.relationFields[i];
            const targetField = field.relationReferences[i];
            const relStr = `Ref: ${model.name}.${sourceField} > ${targetModel}.${targetField}`;
            if (!renderedRels.has(relStr)) {
               dbml += `${relStr}\n`;
               renderedRels.add(relStr);
            }
          }
        }
      }
    }
  }
  
  return dbml;
}

// 1. Generate Master DBML
const masterDbml = generateDBML(models, true);
fs.writeFileSync(path.join(ERD_OUT_DIR, 'master.dbml'), masterDbml);

// 2. Group by Domain and generate module DBMLs
const domains = new Set(models.map(m => m.domain));
for (const domain of domains) {
  const domainModels = models.filter(m => m.domain === domain);
  const domainDbml = generateDBML(domainModels, false);
  fs.writeFileSync(path.join(MODULES_DIR, `${domain}.dbml`), domainDbml);
}

// 3. Create README
const readme = `# Database ERDs

This directory contains auto-generated Database Markup Language (DBML) files for the Enterprise ERP.

- **master.dbml**: Contains all ${models.length} models and cross-domain relationships.
- **modules/**: Contains DBML diagrams isolated by operational domain.

## Domains Overview
${Array.from(domains).map(d => `- **${d}**: ${models.filter(m => m.domain === d).length} models`).join('\n')}

## Usage
You can visualize these files using tools like [dbdiagram.io](https://dbdiagram.io) or any DBML renderer.
`;
fs.writeFileSync(path.join(ERD_OUT_DIR, 'README.md'), readme);

console.log(`Generated ERDs successfully!`);
console.log(`Total Models: ${models.length}`);
console.log(`Master ERD: docs/database/erd/master.dbml`);
console.log(`Modules generated: ${domains.size}`);
