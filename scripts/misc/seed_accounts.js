const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function run() {
    console.log('Seeding 86 Real-World Accounting nodes...');
    const data = JSON.parse(fs.readFileSync(__dirname + '/accounts_payload.json', 'utf8'));

    // Sort by code length to insert parents first, then children
    data.sort((a, b) => a.code.length - b.code.length);

    console.log('Cleared existing accounts (optional: comment out if needed).');
    
    let mapped = 0;
    for (const item of data) {
        const c = item.code;
        let type = 'asset';
        if (c.startsWith('1')) type = 'asset';
        else if (c.startsWith('2')) type = 'liability';
        else if (c.startsWith('3')) type = 'equity';
        else if (c.startsWith('4')) type = 'revenue';
        else if (c.startsWith('5')) type = 'expense';

        let parentId = 0;
        let level = 1;
        
        // Find parent if applicable
        if (item.parent) {
            const parentCode = item.parent.split('-')[0].trim();
            if (parentCode && parentCode !== c) {
                const pNode = await prisma.account.findFirst({ where: { code: parentCode }});
                if (pNode) {
                    parentId = pNode.id;
                    level = pNode.level + 1;
                }
            }
        }

        // Check if exists
        let exists = await prisma.account.findFirst({ where: { code: c } });
        if (exists) {
            await prisma.account.update({
                where: { id: exists.id },
                data: {
                    name: item.name,
                    type,
                    parentId,
                    level
                }
            });
        } else {
            await prisma.account.create({
                data: {
                    code: c,
                    name: item.name,
                    type,
                    parentId,
                    level
                }
            });
        }
        mapped++;
    }
    console.log(`Successfully seeded ${mapped} comprehensive accounts.`);
    await prisma.$disconnect();
}

run().catch(e => {
    console.error(e);
    prisma.$disconnect();
});
