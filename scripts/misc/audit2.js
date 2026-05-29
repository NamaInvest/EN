const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = [
        'echo "=== PM2 List ==="',
        'pm2 list 2>/dev/null | grep -E "name|n[0-9]"',
        'echo "=== N11 Port ==="',
        'grep PORT /www/wwwroot/n11.namainvist.com/.env 2>/dev/null',
        'echo "=== Databases ==="',
        "sudo -u postgres psql -tAc \"SELECT datname FROM pg_database WHERE datname SIMILAR TO 'n[0-9]+_db' ORDER BY datname;\" 2>/dev/null",
        'echo "=== Nginx Configs ==="',
        'ls /www/server/panel/vhost/nginx/n*.conf 2>/dev/null',
    ].join(' && ');
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
