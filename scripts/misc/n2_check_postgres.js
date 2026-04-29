const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const d1 = await prisma.zATCASetting.findMany();
        const d2 = await prisma.setting.findMany();
        console.log("ZATCASetting: ", JSON.stringify(d1, null, 2));
        console.log("System Settings: ", JSON.stringify(d2.filter(s => s.key === 'zatca_environment' || s.key.includes('tax')), null, 2));
    } catch(e) {
        console.log("Error:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}
check();
