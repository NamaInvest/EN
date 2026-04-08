const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 restart nama-main', (err, stream) => {
        stream.on('data', d => console.log(d.toString())).on('close', () => {
            console.log('nama-main restarted!');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
