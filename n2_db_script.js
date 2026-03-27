
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
    try {
        const r = await p.setting.findMany({
            where: { key: { in: ['zatca_environment', 'tax_number', 'zatca_csr_base64'] } }
        });
        console.log("------- DB RESULTS -------");
        console.log(JSON.stringify(r, null, 2));
    } finally {
        await p.$disconnect();
    }
}
run();
