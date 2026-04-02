const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 logs n2 --lines 100 --nostream', (err, stream) => {
        let out = "";
        stream.on('data', d => out += d);
        stream.on('close', () => {
             console.log("n2 pm2 logs:");
             console.log(out);
             conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
