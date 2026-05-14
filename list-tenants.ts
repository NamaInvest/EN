import { PrismaClient } from '@prisma/client';

async function run() {
    const prisma = new PrismaClient();
    const t = await prisma.tenantAccount.findMany();
    console.log(t.map(x => x.subdomain));
    await prisma.$disconnect();
}

run().catch(console.error);
