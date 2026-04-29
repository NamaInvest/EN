const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // شوف الخطأ الكامل في البناء
    conn.exec('cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | grep -A5 "error\\|Error\\|Cannot\\|Module not found" | head -40', (e, s) => {
        if (e) { conn.end(); return; }
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stdout.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
