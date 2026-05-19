const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.invoiceCapture.findFirst({ orderBy: { createdAt: 'desc' } });
  console.log(JSON.stringify(c, null, 2));
}
main().finally(() => prisma.$disconnect());
