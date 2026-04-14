const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // نأخذ آخر أخطاء N11 لتحديد السبب
    const cmd = 'pm2 logs n11 --lines 50 --nostream 2>&1 | tail -60';
    conn.exec(cmd, (e, s) => {
        if (e) { console.log('error:', e.message); conn.end(); return; }
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stdout.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
