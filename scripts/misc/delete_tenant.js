const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = [
        // 1. Stop and delete PM2 process
        'echo "[1] Deleting PM2 process..."',
        'pm2 stop namainvest 2>/dev/null || true',
        'pm2 delete namainvest 2>/dev/null || true',
        'pm2 save --force',
        'rm -f /root/.pm2/pids/namainvest-18.pid',
        'rm -f /root/.pm2/logs/namainvest*.log',
        'echo "PM2 done"',

        // 2. Delete app directory
        'echo "[2] Deleting app directory..."',
        'rm -rf /www/wwwroot/namainvest.namainvist.com',
        'echo "App dir done"',

        // 3. Drop PostgreSQL database
        'echo "[3] Dropping database..."',
        "sudo -u postgres psql -c \"DROP DATABASE IF EXISTS namainvest_db;\" 2>/dev/null",
        'echo "DB done"',

        // 4. Delete nginx config
        'echo "[4] Deleting nginx config..."',
        'rm -f /www/server/panel/vhost/nginx/namainvest.namainvist.com.conf',
        'rm -f /www/server/panel/vhost/nginx/well-known/namainvest.conf',
        'rm -f /www/server/panel/vhost/nginx/proxy/namainvest.namainvist.com/proxy.conf',
        'rmdir /www/server/panel/vhost/nginx/proxy/namainvest.namainvist.com 2>/dev/null || true',
        'rm -f /etc/nginx/sites-enabled/namainvest.namainvist.com',
        'echo "Nginx conf done"',

        // 5. Delete logs
        'echo "[5] Deleting logs..."',
        'rm -f /www/wwwlogs/namainvest.log',
        'rm -f /www/wwwlogs/namainvest.error.log',
        'echo "Logs done"',

        // 6. Reload aaPanel nginx
        'echo "[6] Reloading aaPanel nginx..."',
        '/www/server/nginx/sbin/nginx -t -c /www/server/nginx/conf/nginx.conf 2>&1 && /www/server/nginx/sbin/nginx -s reload -c /www/server/nginx/conf/nginx.conf',
        'echo "Nginx reloaded"',

        // 7. Verify everything is gone
        'echo "=== Verification ==="',
        'pm2 list | grep namainvest || echo "PM2: CLEAN"',
        'ls /www/wwwroot/namainvest.namainvist.com 2>/dev/null || echo "AppDir: CLEAN"',
        "sudo -u postgres psql -tAc \"SELECT datname FROM pg_database WHERE datname='namainvest_db';\" 2>/dev/null | grep . || echo 'DB: CLEAN'",
        'ls /www/server/panel/vhost/nginx/namainvest.namainvist.com.conf 2>/dev/null || echo "NginxConf: CLEAN"',
        'echo "=== ALL DONE ==="',
    ].join(' && ');

    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
