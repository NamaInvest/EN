const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
    const users = await p.user.findMany({ include: { permissions: true }, orderBy: { id: 'asc' } });
    users.forEach(u => {
        console.log('--- User ID:' + u.id + ' username:' + u.username + ' role:' + u.role + ' ---');
        u.permissions.forEach(x => console.log('  - ' + x.module));
        if (u.permissions.length === 0) console.log('  (NO PERMISSIONS - legacy admin mode)');
    });
    await p['$disconnect']();
})();
