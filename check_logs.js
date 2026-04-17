const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = 'pm2 logs saas-app --lines 30 --nostream 2>/dev/null; pm2 show saas-app 2>/dev/null | head -30';
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
