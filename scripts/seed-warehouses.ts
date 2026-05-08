import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedWarehouses() {
  console.log('🌱 Starting Warehouse Seeding...');

  try {
    // 1. Ensure Main Warehouse exists
    let mainWarehouse = await prisma.stock.findFirst({ where: { id: 1 } });
    if (!mainWarehouse) {
      console.log('🏗️ Creating Main Warehouse...');
      mainWarehouse = await prisma.stock.create({
        data: {
          id: 1,
          name: 'المستودع الرئيسي',
          active: true,
        },
      });
    }

    // 2. Fetch all products
    const products = await prisma.product.findMany({
      include: { productStocks: true }
    });

    console.log(`📦 Found ${products.length} total products. Integrating legacy stock...`);

    let migratedCount = 0;

    for (const product of products) {
      // Check if it already has stock records
      if (product.productStocks.length === 0 && Number(product.currentStock) !== 0) {
        await prisma.productStock.create({
          data: {
            productId: product.id,
            stockId: mainWarehouse.id,
            quantity: product.currentStock,
          }
        });
        migratedCount++;
      }
    }

    console.log(`✅ Successfully migrated ${migratedCount} products to the Main Warehouse.`);
    console.log('🎉 Seeding Complete!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedWarehouses();
