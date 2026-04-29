const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const products = await prisma.product.findMany({ take: 5 });
    console.log("Products:");
    products.forEach(p => console.log(p.id, p.name, p.nameAr));
    
    const categories = await prisma.category.findMany({ take: 5 });
    console.log("\nCategories:");
    categories.forEach(c => console.log(c.id, c.name, c.nameAr));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
check();
