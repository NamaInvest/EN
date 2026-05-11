const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
        cd /www/wwwroot/namainvist.com &&
        DATABASE_URL="postgresql://postgres:RootPassNama123@127.0.0.1:5432/n11_db?schema=public" npx prisma@5.22.0 db push --accept-data-loss &&
        DATABASE_URL="postgresql://postgres:RootPassNama123@127.0.0.1:5432/n1_db?schema=public" npx prisma@5.22.0 db push --accept-data-loss &&
        npx prisma@5.22.0 generate &&
        pm2 restart all
    `;
    conn.exec(cmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
