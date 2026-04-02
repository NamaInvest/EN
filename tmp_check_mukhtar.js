const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cd /www/wwwroot/n2.namainvist.com && grep -r "MUKHTAR" .next/static/chunks/', (err, stream) => {
        let out = "";
        stream.on('data', d => out += d);
        stream.on('close', () => {
             console.log("Grep Output for MUKHTAR: ", out);
             conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
