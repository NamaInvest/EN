const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: "postgresql://postgres:RootPassNama123@127.0.0.1:5432/n11_db?schema=public" } }
});

async function test() {
  try {
    console.log("Creating product 1...");
    const p1 = await prisma.product.create({
      data: { tenantId: 'test1', name: 'Product 1', barcode: null, unitId: 1 }
    });
    console.log("P1 created:", p1.id);

    console.log("Creating product 2...");
    const p2 = await prisma.product.create({
      data: { tenantId: 'test1', name: 'Product 2', barcode: null, unitId: 1 }
    });
    console.log("P2 created:", p2.id);
    
    await prisma.product.deleteMany({ where: { tenantId: 'test1' } });
    console.log("Test successful!");
  } catch(e) {
    console.error("Test failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
