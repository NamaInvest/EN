const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('grep "I18nProvider" /www/wwwroot/n4.namainvist.com/src/app/layout.tsx || echo "MISSING"', (err, stream) => {
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => { console.log("N4 I18n Check: \\n" + out); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
