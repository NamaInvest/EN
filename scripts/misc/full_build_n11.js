const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1', (e, s) => {
        if (e) { conn.end(); return; }
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stdout.write(d.toString()));
        s.on('close', () => { console.log('\n=== DONE ==='); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
