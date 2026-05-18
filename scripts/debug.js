const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    let unitId = null;
    let categoryId = null;
    try {
        const u = await prisma.unit.upsert({ where: { nameAr: 'حبة' }, update: {}, create: { nameAr: 'حبة', nameEn: 'Piece' } });
        unitId = u.id;
        const c = await prisma.category.upsert({ where: { nameAr: 'تجزئة' }, update: {}, create: { nameAr: 'تجزئة', nameEn: 'Retail' } });
        categoryId = c.id;
    } catch(e) {
      console.error("unit/cat error:", e.message);
    }
    await prisma.product.create({
      data: { name: "Demo Product 1", barcode: "10001", sellPrice: 51, buyPrice: 31, taxRate: 15, tenantId: "namasoft-retail-demo", unitId, categoryId }
    });
    console.log("Product success");
  } catch(e) {
    console.error("Product error:", e.message);
  }
}
main();
