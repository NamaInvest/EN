import { PrismaClient } from '@prisma/client';
import { seedFeatureDemo } from '../../feature-demo.js';

export async function runPharmacySeed(prisma: PrismaClient, tenantId: string) {
    console.log(`\n💊 Starting Pharmacy Vertical Seed for tenant: ${tenantId}...`);
    
    // 01-company
    await seedCompany(prisma, tenantId);
    
    // 03-products
    await seedProducts(prisma, tenantId);
    
    // feature-demo
    await seedFeatureDemo(prisma, tenantId);

    console.log(`✅ Pharmacy Vertical Seed complete for ${tenantId}`);
}

async function seedCompany(prisma: PrismaClient, tenantId: string) {
    console.log('Seeding company profile...');
    // Realistically we would upsert Tenant, Company, Branch
    // Assuming schema supports it, for the demo we mock creating records.
    await prisma.setting.upsert({
        where: { key: `company_name_${tenantId}` },
        update: {},
        create: { key: `company_name_${tenantId}`, value: 'صيدلية الشفاء', description: 'اسم الشركة' }
    });
    await prisma.setting.upsert({
        where: { key: `tax_number_${tenantId}` },
        update: {},
        create: { key: `tax_number_${tenantId}`, value: '311122233300003', description: 'الرقم الضريبي' }
    });
}

async function seedProducts(prisma: PrismaClient, tenantId: string) {
    console.log('Seeding pharmacy products...');
    const products = [
        { name: 'بنادول أدفانس 500 ملجم', price: 15.5, barcode: '5011080133246' },
        { name: 'فيتامين سي 1000 ملجم فوار', price: 25.0, barcode: '6281000000123' },
        { name: 'مقياس حرارة براون', price: 250.0, barcode: '4022167123456' },
        { name: 'كمامات طبية 50 حبة', price: 10.0, barcode: '6281234567890' },
        { name: 'شراب بروفين للأطفال', price: 12.0, barcode: '5000123456789' }
    ];
    
    for (const p of products) {
        await prisma.product.create({
            data: {
                name: p.name,
                nameEn: p.name,
                sellPrice: p.price,
                buyPrice: p.price * 0.7, // 30% margin
                barcode: p.barcode,
                active: true,
                tenantId: tenantId
            }
        });
    }
}
