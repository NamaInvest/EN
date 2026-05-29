const { Client } = require('ssh2');
const conn = new Client();
const BASE = '/www/wwwroot/n3.namainvist.com';

conn.on('ready', () => {
    const cmd = `cd ${BASE} && node -e "
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();
async function clean() {
    const shifts = await prisma.shift.findMany();
    let count = 0;
    for (const s of shifts) {
        if (Number.isNaN(s.startingCash) || Number.isNaN(s.endingCashActual)) {
            await prisma.shift.delete({ where: { id: s.id } });
            count++;
        }
    }
    console.log('Deleted ' + count + ' NaN shifts');
}
clean().then(()=>process.exit(0));
"`;
    conn.exec(cmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
