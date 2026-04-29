const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
    const s = await p.setting.findMany({
        where: { key: { in: ['zatca_production_token', 'zatca_private_key', 'tax_number', 'zatca_enabled'] } }
    });
    s.forEach(x => console.log(x.key, '=', (x.value || 'EMPTY').substring(0, 30)));
    if (s.length === 0) console.log('NO ZATCA SETTINGS FOUND');
    await p.$disconnect();
})();
