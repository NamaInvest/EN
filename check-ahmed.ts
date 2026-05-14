import { PrismaClient } from '@prisma/client';

async function run() {
    const prisma = new PrismaClient();
    const count = await prisma.account.count({ where: { tenantId: 'ahmedalyamicompany' } });
    console.log('Accounts for ahmedalyamicompany:', count);
    
    // How many journal entries?
    const jeCount = await prisma.journalEntry.count({ where: { tenantId: 'ahmedalyamicompany' } });
    console.log('Journal entries for ahmedalyamicompany:', jeCount);
    
    await prisma.$disconnect();
}

run().catch(console.error);
