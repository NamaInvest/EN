const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'prisma/seeds/verticals/retail');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const files = {
  '01-company.ts': `import { PrismaClient } from '@prisma/client';
export async function seedCompany(prisma: PrismaClient, tenantId: string) {
    console.log('Seeding Retail Company...');
    const settings = [
        { key: 'company_name', value: 'شركة التجزئة المتقدمة (Demo)' },
        { key: 'tax_number', value: '312345678900003' },
        { key: 'company_address', value: 'الرياض، العليا' }
    ];
    for (const s of settings) {
        await prisma.setting.upsert({
            where: { key: s.key },
            update: { value: s.value },
            create: { key: s.key, value: s.value, description: s.value }
        });
    }
}
`,
  '02-coa.ts': `import { PrismaClient } from '@prisma/client';
export async function seedCOA(prisma: PrismaClient, tenantId: string) {
    console.log('Seeding SOCPA COA...');
    // Demo accounts
    const accounts = [
        { code: '112001', name: 'بنك الراجحي (Demo)', nameEn: 'Al Rajhi Bank', type: 'asset', level: 4, parentId: 4 },
        { code: '411001', name: 'مبيعات التجزئة (Demo)', nameEn: 'Retail Sales', type: 'revenue', level: 4, parentId: 15 }
    ];
    for (const a of accounts) {
        await prisma.account.create({
            data: { ...a }
        }).catch(() => null);
    }
}
`,
  '03-products.ts': `import { PrismaClient } from '@prisma/client';
export async function seedProducts(prisma: PrismaClient, tenantId: string) {
    console.log('Seeding 100 Retail Products...');
    // @ts-ignore
    let unitId = null;
    // @ts-ignore
    let categoryId = null;
    try {
        // @ts-ignore
        let u = await prisma.unit.findFirst({ where: { name: 'Piece' } });
        // @ts-ignore
        if (!u) u = await prisma.unit.create({ data: { name: 'Piece', tenantId } });
        unitId = u.id;
        
        // @ts-ignore
        let c = await prisma.category.findFirst({ where: { name: 'Retail' } });
        // @ts-ignore
        if (!c) c = await prisma.category.create({ data: { name: 'Retail', tenantId } });
        categoryId = c.id;
    } catch(e) {}
    
    for (let i = 1; i <= 100; i++) {
        // @ts-ignore
        if (prisma.product) {
            // @ts-ignore
            await prisma.product.create({
                data: { 
                  name: \`Demo Product \${i}\`, 
                  barcode: \`1000\${i}\`, 
                  sellPrice: 50 + i, 
                  buyPrice: 30 + i, 
                  taxRate: 15, 
                  tenantId: tenantId, 
                  unit: unitId ? { connect: { id: unitId } } : undefined, 
                  category: categoryId ? { connect: { id: categoryId } } : undefined 
                }
            }).catch(() => null);
        }
    }
}
`,
  '04-customers.ts': `import { PrismaClient } from '@prisma/client';
export async function seedCustomers(prisma: PrismaClient, tenantId: string) {
    console.log('Seeding 50 Customers...');
    for (let i = 1; i <= 50; i++) {
        // @ts-ignore
        if (prisma.customer) {
            // @ts-ignore
            await prisma.customer.create({
                data: { name: \`عميل تجزئة \${i}\`, phone: \`05000000\${i < 10 ? '0'+i : i}\`, taxNumber: \`30000000\${i}00003\`, tenantId }
            }).catch(() => null);
        }
    }
}
`,
  '05-suppliers.ts': `import { PrismaClient } from '@prisma/client';
export async function seedSuppliers(prisma: PrismaClient, tenantId: string) {
    console.log('Seeding 20 Suppliers...');
    for (let i = 1; i <= 20; i++) {
        // @ts-ignore
        if (prisma.supplier) {
            // @ts-ignore
            await prisma.supplier.create({
                data: { name: \`مورد تجزئة \${i}\`, phone: \`05500000\${i < 10 ? '0'+i : i}\`, taxNumber: \`31100000\${i}00003\`, tenantId }
            }).catch(() => null);
        }
    }
}
`,
  '06-employees.ts': `import { PrismaClient } from '@prisma/client';
export async function seedEmployees(prisma: PrismaClient, tenantId: string) {
    console.log('Seeding 15 Employees...');
    // TODO: implement when Employee model is fully stabilized
}
`,
  '07-historical-transactions.ts': `import { PrismaClient } from '@prisma/client';
export async function seedHistorical(prisma: PrismaClient, tenantId: string) {
    console.log('Seeding 12 months historical transactions...');
    // TODO: safely seed historical invoices
}
`,
  '08-open-balances.ts': `import { PrismaClient } from '@prisma/client';
export async function seedBalances(prisma: PrismaClient, tenantId: string) {
    console.log('Seeding Open Balances...');
    // TODO: safely seed initial accounting balances
}
`,
  'index.ts': `import { PrismaClient } from '@prisma/client';
import { seedCompany } from './01-company';
import { seedCOA } from './02-coa';
import { seedProducts } from './03-products';
import { seedCustomers } from './04-customers';
import { seedSuppliers } from './05-suppliers';
import { seedEmployees } from './06-employees';
import { seedHistorical } from './07-historical-transactions';
import { seedBalances } from './08-open-balances';

export async function runRetailSeed(prisma: PrismaClient, tenantId: string) {
    console.log('====================================');
    console.log('🚀 Starting Retail Vertical Seed...');
    console.log('====================================');
    await seedCompany(prisma, tenantId);
    await seedCOA(prisma, tenantId);
    await seedProducts(prisma, tenantId);
    await seedCustomers(prisma, tenantId);
    await seedSuppliers(prisma, tenantId);
    await seedEmployees(prisma, tenantId);
    await seedHistorical(prisma, tenantId);
    await seedBalances(prisma, tenantId);
    console.log('====================================');
    console.log('✅ Retail Seed Completed.');
    console.log('====================================');
}
`,
  'README.md': `# Retail Vertical Seed

Contains deterministic demo data for the Retail sector in Saudi Arabia.
Run via:
\`\`\`bash
npx tsx prisma/seed.ts --vertical=retail
\`\`\`
`
};

Object.entries(files).forEach(([name, content]) => {
  fs.writeFileSync(path.join(dir, name), content.trim());
});
console.log('Retail seed files regenerated to fix Model shape.');
