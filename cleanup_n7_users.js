const { Client } = require('ssh2');
const conn = new Client();
const N7 = '/www/wwwroot/n7.namainvist.com';

const cleanScript = `
const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();

async function run() {
    // حذف كل المستخدمين ما عدا admin
    const deleted = await p.user.deleteMany({ where: { username: { not: 'admin' } } });
    console.log('Deleted extra users:', deleted.count);

    // عرض المتبقين
    const users = await p.user.findMany();
    users.forEach(u => console.log(' -', u.id, u.username, u.role));
    
    await p['$disconnect']();
}
run().catch(e => { console.error(e.message); process.exit(1); });
`;

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        // Write cleanup script to n7 dir
        const writeStream = sftp.createWriteStream(`${N7}/cleanup_users.js`);
        writeStream.write(cleanScript);
        writeStream.end();
        writeStream.on('close', () => {
            console.log('✅ cleanup script uploaded');
            const cmd = `
cd ${N7}
echo "=== Cleaning non-admin users from n7_db ==="
node cleanup_users.js
rm cleanup_users.js
echo "=== Done ==="
`;
            conn.exec(cmd, (e2, s2) => {
                s2.on('data', d => process.stdout.write(d.toString()));
                s2.stderr.on('data', d => process.stderr.write(d.toString()));
                s2.on('close', () => conn.end());
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
