const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('ls -la /www/wwwroot/n1.namainvist.com/prisma/data.db', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
