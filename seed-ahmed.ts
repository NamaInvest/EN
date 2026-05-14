import { PrismaClient } from '@prisma/client';
import { seedSocpaCoA } from './src/lib/seed-socpa-coa';

async function run() {
    const prisma = new PrismaClient();
    
    console.log('Seeding SOCPA CoA for ahmedalyamicompany...');
    const result = await seedSocpaCoA('ahmedalyamicompany', prisma);
    console.log('Result:', result);
    
    await prisma.$disconnect();
}

run().catch(console.error);
