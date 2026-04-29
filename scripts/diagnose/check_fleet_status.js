const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = [
        'pm2 list 2>&1 | head -30',
        'echo "=== N11 HTTP ==="',
        'curl -s -o /dev/null -w "%{http_code}" http://localhost:3011 2>&1',
        'echo ""',
        'echo "=== N11 PM2 logs last 20 ==="',
        'pm2 logs n11 --lines 20 --nostream 2>&1',
    ].join(' && ');
    
    conn.exec(cmd, (e, s) => {
        if (e) { console.log('error:', e.message); conn.end(); return; }
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stdout.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
