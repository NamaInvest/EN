const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cd /www/wwwroot/n11.namainvist.com && DATABASE_URL="postgresql://postgres@localhost/ajyad_db?host=/var/run/postgresql&schema=public" npx prisma db push --schema=prisma/schema.prisma --accept-data-loss', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
