const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
    const settings = await prisma.setting.findMany();
    console.log(settings.map(s => s.key).filter(k => k.includes('cr') || k.includes('company')));
    await prisma.$disconnect();
}
run();
