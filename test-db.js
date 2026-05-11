const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        const res = await prisma.$queryRaw`SELECT trigger_name, action_statement FROM information_schema.triggers WHERE event_object_table = 'products'`;
        console.log("TRIGGERS:", res);
        
        // Also let's check the schema definition of products
        const cols = await prisma.$queryRaw`SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'barcode'`;
        console.log("COLS:", cols);
    } catch(e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
