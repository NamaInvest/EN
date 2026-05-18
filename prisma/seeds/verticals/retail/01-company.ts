import { PrismaClient } from '@prisma/client';
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