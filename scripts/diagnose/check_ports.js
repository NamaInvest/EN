const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = [
        'echo "=== ما الذي يشغل port 3000؟ ==="',
        'fuser 3000/tcp 2>/dev/null && lsof -i :3000 | head -5',
        'echo "=== جميع البورتات المستخدمة ==="',
        'ss -tlnp | grep -E "3[0-9]{3,}"',
    ].join(' && ');
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
