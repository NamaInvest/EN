const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding MRP Dummy Data...");

  // 1. Create Raw Materials
  const raw1 = await prisma.product.create({
    data: {
      name: 'خشب زان ممتاز V3',
      barcode: 'RAW-WOOD-001-V3',
      buyPrice: 150,
      sellPrice: 0,
      taxRate: 15,
      taxType: 'inclusive',
      currentStock: 50, // Low stock to trigger shortage
      minQuantity: 100,
      active: true,
    }
  });

  const raw2 = await prisma.product.create({
    data: {
      name: 'مسامير صلب 5سم V3',
      barcode: 'RAW-SCR-002-V3',
      buyPrice: 0.5,
      sellPrice: 0,
      taxRate: 15,
      taxType: 'inclusive',
      currentStock: 1000,
      minQuantity: 500,
      active: true,
    }
  });

  const raw3 = await prisma.product.create({
    data: {
      name: 'دهان عالي الجودة V3',
      barcode: 'RAW-PNT-003-V3',
      buyPrice: 80,
      sellPrice: 0,
      taxRate: 15,
      taxType: 'inclusive',
      currentStock: 10, // Shortage
      minQuantity: 50,
      active: true,
    }
  });

  // 2. Create Finished Good
  const finished = await prisma.product.create({
    data: {
      name: 'طاولة طعام خشبية فاخرة V3',
      barcode: 'FG-TBL-101-V3',
      buyPrice: 0,
      sellPrice: 1200,
      taxRate: 15,
      taxType: 'inclusive',
      currentStock: 5,
      minQuantity: 10,
      active: true,
    }
  });

  // 3. Create BOM (Recipe)
  const recipe = await prisma.recipe.create({
    data: {
      name: 'وصفة الطاولة الفاخرة V3',
      finishedProductId: finished.id,
      ingredients: {
        create: [
          { rawProductId: raw1.id, quantity: 4, estimatedCost: 600, scrapPercentage: 5 }, // 4 units of wood + 5% scrap
          { rawProductId: raw2.id, quantity: 50, estimatedCost: 25, scrapPercentage: 2 }, // 50 screws + 2% scrap
          { rawProductId: raw3.id, quantity: 2, estimatedCost: 160, scrapPercentage: 10 } // 2 units of paint + 10% scrap
        ]
      }
    }
  });

  // 4. Create Work Center & Machines
  const wc = await prisma.workCenter.create({
    data: {
      name: 'ورشة التجميع والدهان',
      code: 'WC-01',
      costPerHour: 50,
    }
  });

  const machine1 = await prisma.machine.create({
    data: {
      name: 'منشار آلي دقيق',
      code: 'MCH-SAW',
      hourlyCost: 20,
      status: 'active'
    }
  });

  const machine2 = await prisma.machine.create({
    data: {
      name: 'غرفة الدهان الحراري',
      code: 'MCH-PNT',
      hourlyCost: 40,
      status: 'maintenance'
    }
  });

  // 5. Create Draft & In Progress Work Orders
  const order1 = await prisma.manufacturingOrder.create({
    data: {
      orderNumber: 'WO-2026-001',
      recipeId: recipe.id,
      machineId: machine1.id,
      quantityToProduce: 20, // High quantity to trigger huge shortages!
      startDate: new Date(),
      status: 'draft',
      totalCost: 15700,
      stockId: 1
    }
  });

  const order2 = await prisma.manufacturingOrder.create({
    data: {
      orderNumber: 'WO-2026-002',
      recipeId: recipe.id,
      quantityToProduce: 5,
      startDate: new Date(),
      status: 'in_progress',
      totalCost: 3925,
      stockId: 1
    }
  });

  console.log("Seeding complete! Dummy data injected successfully.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
