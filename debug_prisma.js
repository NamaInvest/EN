const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cd /www/wwwroot/n11.namainvist.com && DATABASE_URL="postgresql://n11_db:n11_pass123@localhost:5432/ajyad_db?schema=public" DEBUG="*" npx prisma db push --schema=prisma/schema.prisma --accept-data-loss', (err, stream) => {
        let out = '';
        stream.on('data', d => { out+=d; });
        stream.stderr.on('data', d => { out+=d; });
        stream.on('close', () => {
            console.log(out.substring(out.length - 2000));
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
