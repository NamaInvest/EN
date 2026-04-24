const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log(tenants.map(t => ({ id: t.id, name: t.name, companyName: t.companyName })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
