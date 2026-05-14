import { PrismaClient } from '@prisma/client';

async function run() {
    const prisma = new PrismaClient();
    const t = await prisma.tenantAccount.findFirst({ where: { subdomain: 'ahmedalyamicompany' } });
    console.log(t);
    await prisma.$disconnect();
}

run().catch(console.error);
