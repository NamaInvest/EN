const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('fuser -k 3001/tcp ; pm2 restart nama-main ; sleep 3 ; pm2 status | grep nama', (err, stream) => {
        stream.on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d)).on('close', (c) => {
            console.log(`Done! Code: ${c}`);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
