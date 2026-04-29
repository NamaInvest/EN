const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const prodCount = await prisma.product.count();
        console.log('Total products currently in DB:', prodCount);

        let stock = await prisma.stock.findFirst({ where: { id: 1 } });
        if (!stock) {
            console.log('Main stock ID=1 not found! Creating it...');
            stock = await prisma.stock.create({
                data: { id: 1, name: 'Main Warehouse', active: true }
            });
        }

        const products = await prisma.product.findMany({
            include: { productStocks: true },
        });

        let fixed = 0;
        for (const p of products) {
            if (p.productStocks.length === 0) {
                await prisma.productStock.create({
                    data: {
                        productId: p.id,
                        stockId: stock.id,
                        quantity: p.currentStock || 0,
                    }
                });
                fixed++;
            }
        }
        console.log(`Successfully created ProductStock relations for ${fixed} products.`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
