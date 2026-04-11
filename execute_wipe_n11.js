const { Client } = require('ssh2');
const conn = new Client();

const scriptContent = `
const { PrismaClient } = require('/www/wwwroot/n11.namainvist.com/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('STARTING POSTGRESQL CASCADING TRUNCATE...');
    
    // Get all tables except the core ones we want to keep
    const excluded = ["'users'", "'settings'", "'companies'", "'branches'", "'subscriptions'", "'accounts'", "'system_alerts'", "'_prisma_migrations'"];
    
    const result = await prisma.$queryRawUnsafe(\`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN (\${excluded.join(', ')})\`);
    const tables = result.map(r => r.tablename);
    
    if (tables.length > 0) {
        console.log('Truncating ' + tables.length + ' operational tables...');
        const query = \`TRUNCATE TABLE \${tables.map(t => '\\"' + t + '\\"').join(', ')} RESTART IDENTITY CASCADE;\`;
        await prisma.$executeRawUnsafe(query);
    }
    
    // Reset account balances
    console.log('Zeroing out accounting ledger balances...');
    await prisma.$executeRawUnsafe('UPDATE accounts SET balance = 0;');
    
    // Now delete non-admin users manually (since we kept the users table)
    console.log('Cleaning non-admin users...');
    await prisma.$executeRawUnsafe("DELETE FROM users WHERE role NOT IN ('admin', 'owner');");
    
    // Seed the foundational POS customer since customers table was truncated
    try {
        await prisma.customer.create({
            data: { id: 1, name: 'عميل نقدي', phone: '000000000', type: 0 }
        });
        console.log('Seeded default customer for POS.');
    } catch(e) {}

    console.log('✅ FACTORY RESET COMPLETE! System is completely wiped.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
`;

conn.on('ready', () => {
    console.log('Connected via SSH...');
    conn.exec('cat > /www/wwwroot/n11.namainvist.com/factory_wipe.js', (err, stream) => {
        if (err) throw err;
        stream.write(scriptContent);
        stream.end();
        console.log('Uploaded wipe script.');
        
        conn.exec('export PATH=$PATH:/www/server/nodejs/v20.14.0/bin && cd /www/wwwroot/n11.namainvist.com && node factory_wipe.js', (err2, stream2) => {
            if (err2) throw err2;
            stream2.on('data', d => process.stdout.write(d));
            stream2.stderr.on('data', d => process.stderr.write(d));
            stream2.on('close', () => conn.end());
        });
    });
}).catch?.(console.error);

conn.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
