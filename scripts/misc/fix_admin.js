const { Client } = require('ssh2');
const conn = new Client();

const fixScript = `
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function run() {
    const hash = bcrypt.hashSync('admin', 10);
    const user = await prisma.user.upsert({
        where: { username: 'admin' },
        update: { passwordHash: hash, role: 'admin', active: true },
        create: { username: 'admin', fullName: 'مدير النظام', passwordHash: hash, role: 'admin', active: true }
    });
    console.log('admin user fixed:', user.username, user.role);
    await prisma.$disconnect();
}
run().catch(e => { console.error(e.message); process.exit(1); });
`;

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        // Write to project dir, not /tmp
        const ws = sftp.createWriteStream('/www/wwwroot/namainvest.namainvist.com/fix_admin.js');
        ws.write(fixScript);
        ws.end();
        ws.on('close', () => {
            conn.exec('cd /www/wwwroot/namainvest.namainvist.com && node fix_admin.js && rm fix_admin.js', (err, s) => {
                s.on('data', d => process.stdout.write(d.toString()));
                s.stderr.on('data', d => process.stderr.write(d.toString()));
                s.on('close', () => conn.end());
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
