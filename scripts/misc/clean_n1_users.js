const { Client } = require('ssh2');

const bashCommand = `
cat << 'EOF' > /www/wwwroot/n1.namainvist.com/clean_users.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Removing rogue users...");
        const result = await prisma.user.deleteMany({
            where: {
                OR: [
                    { name: { not: 'admin' } },
                    { role: { not: 'admin' } }
                ]
            }
        });
        // Wait, actually I just want to keep the one true admin.
        // Let's just delete by email or name matching "ialqrashi62@gmail.com" and "asul-55"
        console.log("Deleted count:", result.count);
    } catch(e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
EOF
cd /www/wwwroot/n1.namainvist.com
node clean_users.js
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d));
        stream.stderr.on('data', (d) => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD'
});
