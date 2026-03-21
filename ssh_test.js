const { Client } = require('ssh2');

const server = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', name: 'N1' };

const script = `
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log("Fetching latest 3 users...");
    const users = await prisma.user.findMany({ orderBy: { id: 'desc' }, take: 3 });
    for (const u of users) {
        console.log(\`\nID: \${u.id} | User: "\${u.username}" | Active: \${u.active}\`);
        console.log(\`Hash: \${u.passwordHash}\`);
        console.log(\`Matches '123': \${bcrypt.compareSync('123', u.passwordHash)}\`);
        console.log(\`Matches '123456': \${bcrypt.compareSync('123456', u.passwordHash)}\`);
        console.log(\`Matches '1234': \${bcrypt.compareSync('1234', u.passwordHash)}\`);
        console.log(\`Matches '0000': \${bcrypt.compareSync('0000', u.passwordHash)}\`);
    }
}
main().finally(() => prisma.$disconnect());
`;

const conn = new Client();
conn.on('ready', () => {
    console.log(`Connected to ${server.name}`);
    conn.exec(`node -e "${script.replace(/"/g, '\\"')}"`, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', (err) => {
    console.error('Connection Error:', err);
}).connect(server);
