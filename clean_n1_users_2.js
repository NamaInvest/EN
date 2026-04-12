const { Client } = require('ssh2');

const bashCommand = `
cat << 'EOF' > /www/wwwroot/n1.namainvist.com/clean_users.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Removing rogue users (non-admins) from n1...");
        const result = await prisma.user.deleteMany({
            where: {
                role: {
                    not: 'admin'
                }
            }
        });
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
    password: '_ee4SWbxLVfH9b'
});
