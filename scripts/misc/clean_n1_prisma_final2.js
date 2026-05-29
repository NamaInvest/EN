const { Client } = require('ssh2');

const bashCommand = `
cat << 'EOF' > /www/wwwroot/n1.namainvist.com/clean_users.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Removing rogue users via Prisma executing Raw SQL...");
        // Since we have foreign key constraints from UserPermissions,
        // we can just delete from UserPermissions first using Prisma ORM.
        
        const usersToDelete = await prisma.user.findMany({
            where: { role: { not: 'admin' } },
            select: { id: true }
        });
        
        const ids = usersToDelete.map(u => u.id);
        console.log("Found ids to delete:", ids);
        
        if (ids.length > 0) {
            await prisma.userPermission.deleteMany({
                where: { userId: { in: ids } }
            });
            await prisma.user.deleteMany({
                where: { id: { in: ids } }
            });
            console.log("Successfully wiped dirty users!");
        } else {
            console.log("No dirty users found.");
        }
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
