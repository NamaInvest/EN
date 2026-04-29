const { Client } = require('ssh2');
const conn = new Client();
const BASE = '/www/wwwroot/n3.namainvist.com';

conn.on('ready', () => {
    const cmd = `cd ${BASE} && node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { const shifts = await prisma.shift.findMany({ orderBy: { id: 'desc' }, take: 2 }); console.log(shifts); } main();"`;
    conn.exec(cmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
