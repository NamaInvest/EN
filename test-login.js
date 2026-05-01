const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

async function test() {
    const prisma = new PrismaClient();
    try {
        const user = await prisma.user.findFirst({
            where: { username: { equals: 'admin', mode: 'insensitive' } },
            include: { permissions: true },
        });
        console.log("User:", user?.username);
        
        // Let's pretend isValid is true
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role,
        };
        const token = jwt.sign(payload, 'secret', { expiresIn: '24h' });
        console.log("Token generated:", !!token);
    } catch(e) {
        console.error("ERROR:", e);
    } finally {
        await prisma.$disconnect();
    }
}
test();
