const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    try {
        const users = await prisma.user.findMany({ select: { id: true, username: true, role: true, permissions: true } });
        console.log(JSON.stringify(users, null, 2));
    } catch (e) {
        console.error('ERROR during test:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
