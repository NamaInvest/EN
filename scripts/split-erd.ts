import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const DBML_PATH = path.join(process.cwd(), 'docs/database/erd/schema.dbml');
const OUT_DIR = path.join(process.cwd(), 'docs/database/erd');

if (!fs.existsSync(DBML_PATH)) {
    console.error('schema.dbml not found. Run npx prisma generate first.');
    process.exit(1);
}

const dbmlContent = fs.readFileSync(DBML_PATH, 'utf-8');

const MODULES: Record<string, string[]> = {
    accounting: ['account', 'journal', 'ledger', 'tax', 'cost_center', 'wht', 'rent_invoice', 'ifrs', 'check_transaction'],
    sales: ['sales_', 'customer', 'pos', 'booking', 'installment', 'loyalty', 'dunning', 'clinic_'],
    purchases: ['purchase_', 'supplier', 'vendor', 'subcontract', 'letter_of_credit', 'landed_cost', 'three_way'],
    inventory: ['inventory', 'stock', 'product', 'category', 'unit', 'warehouse', 'delivery_note', 'goods_receipt', 'serial'],
    manufacturing: ['manufacturing', 'bom', 'work_order', 'production', 'recipe', 'quality'],
    hr: ['hr_', 'employee', 'payroll', 'attendance', 'shift', 'leave'],
    fa: ['fixed_asset', 'asset'],
    treasury: ['treasury', 'bank', 'cash', 'payment_'],
    ai: ['ai_'],
    zatca: ['zatca', 'clearance'],
    master_tenant: ['user', 'role', 'tenant', 'company', 'branch', 'setting', 'audit_log', 'mfa', 'permission', 'document_']
};

function getModuleForTable(tableName: string): string {
    const lowerName = tableName.toLowerCase();
    for (const [mod, prefixes] of Object.entries(MODULES)) {
        if (prefixes.some(p => lowerName.startsWith(p) || lowerName.includes('_' + p))) {
            return mod;
        }
    }
    return 'common';
}

function parseBlocks(content: string) {
    const lines = content.split('\n');
    const blocks: { type: string, name: string, content: string[], module: string }[] = [];
    let currentBlock: any = null;
    let braceCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!currentBlock && (line.startsWith('Table ') || line.startsWith('Enum '))) {
            const match = line.match(/(Table|Enum)\s+([a-zA-Z0-9_]+)/);
            if (match) {
                currentBlock = {
                    type: match[1],
                    name: match[2],
                    content: [line],
                    module: getModuleForTable(match[2])
                };
                braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
                blocks.push(currentBlock);
            }
        } else if (!currentBlock && line.startsWith('Ref:')) {
            blocks.push({
                type: 'Ref',
                name: `Ref_${i}`,
                content: [line],
                module: 'ref' // special handling later
            });
        } else if (currentBlock) {
            currentBlock.content.push(line);
            braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
            if (braceCount === 0) {
                currentBlock = null;
            }
        }
    }
    return blocks;
}

const blocks = parseBlocks(dbmlContent);
const tableBlocks = blocks.filter(b => b.type === 'Table');
const enumBlocks = blocks.filter(b => b.type === 'Enum');
const refBlocks = blocks.filter(b => b.type === 'Ref');

// Add badges: tenantId FK (red), controlled (yellow), soft delete (SD)
tableBlocks.forEach(b => {
    b.content = b.content.map((line, idx) => {
        if (idx === 0) return line; // Skip table declaration
        if (line.includes('tenantId ') && !line.includes('note:')) {
            if (line.includes(']')) return line.replace(']', ", note: '🔴 Tenant']");
            return line + " [note: '🔴 Tenant']";
        }
        if (line.includes('deletedAt ') && !line.includes('note:')) {
            if (line.includes(']')) return line.replace(']', ", note: '[SD]']");
            return line + " [note: '[SD]']";
        }
        if (line.includes('controlled') && !line.includes('note:')) {
            if (line.includes(']')) return line.replace(']', ", note: '🟡 Controlled']");
            return line + " [note: '🟡 Controlled']";
        }
        return line;
    });
});

const moduleNames = Object.keys(MODULES).concat(['common']);

moduleNames.forEach(mod => {
    const modTables = tableBlocks.filter(b => b.module === mod);
    if (modTables.length === 0) return;

    const modTableNames = new Set(modTables.map(b => b.name));
    
    // Find refs that belong to this module
    const modRefs = refBlocks.filter(r => {
        const line = r.content[0];
        const match = line.match(/([a-zA-Z0-9_]+)\.[a-zA-Z0-9_]+\s*>\s*([a-zA-Z0-9_]+)\.[a-zA-Z0-9_]+/);
        if (match) {
            const t1 = match[1];
            const t2 = match[2];
            return modTableNames.has(t1) || modTableNames.has(t2);
        }
        return false;
    });

    // Add external tables used in refs as stubs
    const externalTables = new Set<string>();
    modRefs.forEach(r => {
        const line = r.content[0];
        const match = line.match(/([a-zA-Z0-9_]+)\.[a-zA-Z0-9_]+\s*[><-]+\s*([a-zA-Z0-9_]+)\.[a-zA-Z0-9_]+/);
        if (match) {
            if (!modTableNames.has(match[1])) externalTables.add(match[1]);
            if (!modTableNames.has(match[2])) externalTables.add(match[2]);
        }
    });

    const stubTables = Array.from(externalTables).map(tName => {
        const origTable = tableBlocks.find(b => b.name === tName);
        if (origTable) {
            return { ...origTable, content: [...origTable.content] };
        }
        return null;
    }).filter(Boolean) as typeof blocks;

    // Output DBML
    const finalBlocks = [...modTables, ...stubTables, ...modRefs, ...enumBlocks];
    const outDbml = finalBlocks.map(b => b.content.join('\n')).join('\n\n');
    
    const dbmlFile = path.join(OUT_DIR, `${mod}.dbml`);
    const svgFile = path.join(OUT_DIR, `${mod}.svg`);
    
    fs.writeFileSync(dbmlFile, outDbml);
    
    try {
        console.log(`Rendering ${mod}.svg...`);
        execSync(`npx dbml-renderer -i ${dbmlFile} -o ${svgFile} -f svg`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`Failed to render ${mod}.svg`);
    }
});

console.log('Done splitting ERD.');
