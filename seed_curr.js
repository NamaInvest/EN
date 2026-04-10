const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    await prisma.currency.upsert({
        where: { code: 'SAR' },
        update: { isActive: true, exchangeRate: 1.0, isDefault: true },
        create: { code: 'SAR', name: 'Saudi Riyal', exchangeRate: 1.0, isDefault: true, isActive: true }
    });
    await prisma.currency.upsert({
        where: { code: 'USD' },
        update: { isActive: true },
        create: { code: 'USD', name: 'US Dollar', exchangeRate: 3.75, isDefault: false, isActive: true }
    });
    await prisma.currency.upsert({
        where: { code: 'EUR' },
        update: { isActive: true },
        create: { code: 'EUR', name: 'Euro', exchangeRate: 4.10, isDefault: false, isActive: true }
    });
    await prisma.currency.upsert({
        where: { code: 'AED' },
        update: { isActive: true },
        create: { code: 'AED', name: 'UAE Dirham', exchangeRate: 1.02, isDefault: false, isActive: true }
    });
    console.log('Currencies seeded!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
