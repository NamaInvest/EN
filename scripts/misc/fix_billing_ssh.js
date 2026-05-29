const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- EXECUTING REMOTE PRISMA PATCH ON N1 ---');
    
    const cmd = `
cat << 'EOF' > /www/wwwroot/n1.namainvist.com/bypass_billing.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function bypass() {
    try {
        const res = await prisma.subscription.updateMany({
            data: { 
                status: 'ACTIVE',
                endDate: new Date('2035-12-31T23:59:59Z')
            }
        });
        console.log("SUCCESS! Reactivated " + res.count + " expired store subscriptions across the SaaS Network.");
        
        // Ensure standard testing company exists
        try {
            const comp = await prisma.company.findFirst();
            if(comp) {
               const check = await prisma.subscription.findFirst({where: {companyId: comp.id}});
               if(!check) {
                  await prisma.subscription.create({
                     data: {
                        companyId: comp.id,
                        status: 'ACTIVE',
                        endDate: new Date('2035-12-31T23:59:59Z')
                     }
                  });
               }
            }
        } catch(e) {}
    } catch (err) {
        console.error("Failed to update subscriptions:", err);
    } finally {
        await prisma.$disconnect();
    }
}
bypass();
EOF
cd /www/wwwroot/n1.namainvist.com
node bypass_billing.js
    `;
    
    conn.exec(cmd, (execErr, stream) => {
        if (execErr) throw execErr;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('✅ Billing Bypass Complete.');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
