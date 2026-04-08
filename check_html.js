const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('grep -i "مرتجعات" /www/wwwroot/n1.namainvist.com/.next/server/app/pos/page.html || echo "NOT_FOUND"', (err, stream) => {
        let out = '';
        stream.on('data', d => out += d.toString()).on('close', () => {
            console.log(out);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
