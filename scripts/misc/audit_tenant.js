const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = [
        'echo "=== PM2 Process ==="',
        'pm2 show namainvest 2>/dev/null | grep -E "name|status|port|script path|pid|uptime|mem"',
        'echo "=== App Directory ==="',
        'du -sh /www/wwwroot/namainvest.namainvist.com 2>/dev/null || echo "NOT FOUND"',
        'echo "=== .env ==="',
        'grep -E "^PORT|^DATABASE_URL|^NEXT_PUBLIC_API" /www/wwwroot/namainvest.namainvist.com/.env 2>/dev/null || echo "NO ENV"',
        'echo "=== PostgreSQL ==="',
        "sudo -u postgres psql -tAc \"SELECT datname FROM pg_database WHERE datname LIKE 'namainvest%';\" 2>/dev/null || echo DB_CHECK_FAILED",
        'echo "=== Nginx Config ==="',
        'ls -lh /www/server/panel/vhost/nginx/namainvest.namainvist.com.conf 2>/dev/null || echo "NO NGINX CONF"',
        'echo "=== Logs ==="',
        'ls /www/wwwlogs/namainvest* 2>/dev/null || echo "NO LOGS"',
        'echo "=== DONE ==="',
    ].join(' && ');

    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
