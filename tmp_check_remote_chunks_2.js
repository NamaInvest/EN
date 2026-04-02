const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('grep -rn "Tax Sales Invoices" /www/wwwroot/n2.namainvist.com/.next/static', (err, stream) => {
        let out = "";
        stream.on('data', d => out += d);
        stream.on('close', () => {
             console.log(out.length > 0 ? "Found English: " + out.substring(0, 100) : "NOT FOUND");
             conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
