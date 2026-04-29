const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cat /www/wwwroot/n1.namainvist.com/src/app/pos/page.tsx | grep "مرتجعات"', (err, stream) => {
        let out = '';
        stream.on('data', d => out += d.toString()).on('close', () => {
            console.log("OUT:", out);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
