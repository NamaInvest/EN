const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function main() {
    let success = 0;
    let failed = 0;
    const unit = await prisma.productUnit.findFirst();
    const unitId = unit ? unit.id : 1;
    for (let i = 0; i < 5; i++) {
        try {
            const productData = {
                tenantId: 'test_tenant',
                name: 'Test Product ' + i,
                barcode: `SYS-${crypto.randomUUID()}`,
                unitId: unitId
            };
            await prisma.product.create({ data: productData });
            success++;
        } catch (e) {
            console.error('Failed on', i, e.message);
            failed++;
        }
    }
    console.log(`Success: ${success}, Failed: ${failed}`);
}
main().finally(() => prisma.$disconnect());
