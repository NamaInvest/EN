const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const count = await prisma.category.count();
    console.log('Total Categories:', count);
}
main().finally(() => prisma.$disconnect());
