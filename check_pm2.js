const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 ls', (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
