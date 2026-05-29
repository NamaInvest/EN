const { Client } = require('ssh2');

const server = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', name: 'N1' };

const script = `
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function main() {
    console.log('--- DIAGNOSTIC FOR USER 1 ---');
    const user = await prisma.user.findFirst({ where: { username: { equals: '1', mode: 'insensitive' } } });
    if (!user) {
        console.log('USER "1" DOES NOT EXIST IN DATABASE!');
        const users = await prisma.user.findMany({ take: 5, orderBy: { id: 'desc' } });
        console.log('Last 5 users are:');
        users.forEach(u => console.log(' -> [' + u.username + '] active: ' + u.active));
        return;
    }
    console.log('User found! Username in DB is: [' + user.username + ']');
    console.log('Active status:', user.active);
    console.log('Matches string "1":', bcrypt.compareSync('1', user.passwordHash));
    console.log('Matches string "1 ":', bcrypt.compareSync('1 ', user.passwordHash));
    console.log('Matches string " 1 ":', bcrypt.compareSync(' 1 ', user.passwordHash));
}
main().finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cd /www/wwwroot/n1.namainvist.com && node -e "${script.replace(/"/g, '\\"')}"`, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect(server);
