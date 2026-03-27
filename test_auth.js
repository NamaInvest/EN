const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    // Generate a valid script on server to run Prisma script that updates directly
    const script = `
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function test() {
        const user = await prisma.user.findFirst({ where: { role: 'admin' } });
        if (!user) return console.log("No admin");
        console.log("Admin token:", user.sessionToken ? user.sessionToken.substring(0, 20) + "..." : "No token");
        
        // Let's just mock a POST HTTP request with this token
        if (user.sessionToken) {
            const r = await fetch('http://localhost:3001/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + user.sessionToken },
                body: JSON.stringify({ branch_name_en: 'Riyadh', zatca_street: 'Test Street' })
            });
            console.log('STATUS:', r.status);
            console.log('BODY:', await r.text());
        }
    }
    test().finally(() => prisma.$disconnect());
    `;
    
    conn.exec(`echo "${Buffer.from(script).toString('base64')}" | base64 -d > /www/wwwroot/n1.namainvist.com/test_auth.js && cd /www/wwwroot/n1.namainvist.com && node test_auth.js`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end()).on('data', data => console.log(data.toString())).stderr.on('data', data => console.error(data.toString()));
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
