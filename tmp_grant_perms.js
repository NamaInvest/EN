const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
    if (!adminUser) return console.log('No admin found');
    
    // Some roles might have specific user IDs, we'll give it to all admins just in case
    const admins = await prisma.user.findMany({ where: { role: 'admin' } });
    
    const modules = ['shifts', 'branches'];
    
    for (const admin of admins) {
        for (const mod of modules) {
            const existing = await prisma.userPermission.findFirst({
                where: { userId: admin.id, module: mod }
            });
            if (!existing) {
                await prisma.userPermission.create({
                    data: {
                        userId: admin.id,
                        module: mod,
                        canView: true, canAdd: true, canEdit: true, canDelete: true, canPrint: true
                    }
                });
                console.log(`Granted ${mod} to ${admin.fullName}`);
            } else {
                console.log(`User ${admin.fullName} already had permission for ${mod}`);
            }
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
