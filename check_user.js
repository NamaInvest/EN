const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.exec('cd /www/wwwroot/n11.namainvist.com && /www/server/nodejs/v22.2.0/bin/node -e "const { PrismaClient } = require(\'@prisma/client\'); const p = new PrismaClient(); p.user.findFirst().then(u => console.log(\'User:\', u.username, u.role)).finally(() => p.$disconnect());"', (err, stream) => {
        stream.on('data', d => console.log(d.toString()));
        stream.on('close', () => c.end());
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b', readyTimeout:30000});
