const { Client } = require('ssh2');

function checkCount() {
    const conn = new Client();
    conn.on('ready', () => {
        const cmd = `cd /www/wwwroot/n1.namainvist.com && node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.category.count().then(c => console.log('CAT:', c)); p.product.count().then(c => console.log('PROD:', c));"`;
        conn.exec(cmd, (err, stream) => {
            if (err) throw err;
            stream.on('data', d => process.stdout.write(d.toString()));
            stream.stderr.on('data', d => process.stderr.write(d.toString()));
            stream.on('close', () => conn.end());
        });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
}

checkCount();
