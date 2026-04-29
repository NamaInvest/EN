const { Client } = require('ssh2');
const conn = new Client();

const checkScript = `
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function run() {
    const users = await prisma.user.findMany({ select: { id: true, username: true, role: true, active: true, passwordHash: true } });
    console.log('USERS:', JSON.stringify(users, null, 2));
    
    // Test the password
    const admin = users.find(u => u.username === 'admin');
    if (admin) {
        const ok = bcrypt.compareSync('admin', admin.passwordHash);
        console.log('admin/admin valid?', ok);
        console.log('passwordHash starts with:', admin.passwordHash.substring(0, 10));
    } else {
        console.log('NO admin user found!');
        // Create it
        const hash = bcrypt.hashSync('admin', 10);
        const created = await prisma.user.create({
            data: { username: 'admin', fullName: 'مدير النظام', passwordHash: hash, role: 'admin', active: true }
        });
        console.log('CREATED admin:', created.username);
    }
    await prisma.$disconnect();
}
run().catch(e => { console.error(e.message); process.exit(1); });
`;

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        const ws = sftp.createWriteStream('/www/wwwroot/namainvest.namainvist.com/check_admin.js');
        ws.write(checkScript);
        ws.end();
        ws.on('close', () => {
            conn.exec('cd /www/wwwroot/namainvest.namainvist.com && node check_admin.js && rm check_admin.js', (err, s) => {
                s.on('data', d => process.stdout.write(d.toString()));
                s.stderr.on('data', d => process.stderr.write(d.toString()));
                s.on('close', () => conn.end());
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
