const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst({ include: { permissions: true } }).then(console.log).catch(console.error).finally(() => prisma.$disconnect());
