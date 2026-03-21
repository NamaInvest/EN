const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Fetching latest 5 users...");
        const users = await prisma.user.findMany({
            orderBy: { id: 'desc' },
            take: 5
        });

        for (const u of users) {
            console.log(`\nID: ${u.id} | Username: "${u.username}" | Active: ${u.active} | Role: ${u.role}`);
            console.log(`Hash in DB: ${u.passwordHash}`);
        }
    } catch (e) {
        console.error("PRISMA ERROR CATCH:", e.message);
    }
}

main().finally(() => prisma.$disconnect());
