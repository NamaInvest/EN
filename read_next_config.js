const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cat /www/wwwroot/n3.namainvist.com/next.config.ts', (err, stream) => {
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => { console.log(out); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
