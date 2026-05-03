const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const units = ['حبة', 'كرتون', 'كيلو', 'جرام', 'لتر', 'متر', 'قطعة', 'درزن', 'ملي', 'طن', 'ساعة', 'يوم', 'شهر', 'باقة'];
    for (const u of units) {
        try {
            const exists = await prisma.unit.findFirst({ where: { name: u }});
            if (!exists) {
                await prisma.unit.create({ data: { name: u }});
                console.log('Added:', u);
            }
        } catch(e) {}
    }
    console.log('Done');
}
main().finally(() => prisma.$disconnect());
