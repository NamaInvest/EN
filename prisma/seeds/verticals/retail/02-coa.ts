import { PrismaClient } from '@prisma/client';
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