const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tenantId = 'ahmedalyamicompany';
    
    for (const dbName of ['n11_db', 'n1_db']) {
        const url = `postgresql://postgres:RootPassNama123@127.0.0.1:5432/${dbName}?schema=public`;
        const prismaCustom = new PrismaClient({ datasources: { db: { url } } });
        const count = await prismaCustom.product.count({ where: { tenantId } });
        console.log(`\n=== Products for ${tenantId} in ${dbName} ===`);
        console.log(`Total: ${count}`);
        if (count > 0) {
            const last = await prismaCustom.product.findFirst({ where: { tenantId }, orderBy: { id: 'desc' }});
            console.log(`Last: ${last.name}`);
        }
        await prismaCustom.$disconnect();
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
