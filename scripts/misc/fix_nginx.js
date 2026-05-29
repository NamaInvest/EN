const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const tenants = ['n1','n2','n3','n4','n5','n6','n7','n8','n9','n10'];
    const cmds = [
        ...tenants.map(t => [
            `chattr -i /www/server/panel/vhost/nginx/${t}.namainvist.com.conf 2>/dev/null || true`,
            `rm -f /www/server/panel/vhost/nginx/${t}.namainvist.com.conf`,
            `echo "✅ Nginx deleted: ${t}"`,
        ].join(' && ')),
        '/www/server/nginx/sbin/nginx -t -c /www/server/nginx/conf/nginx.conf 2>&1 && /www/server/nginx/sbin/nginx -s reload',
        'echo "✅ Nginx reloaded"',
        'ls /www/server/panel/vhost/nginx/n*.conf 2>/dev/null | grep -v n11 || echo "Nginx n1-n10: CLEAN ✅"',
        'echo "=== PM2 الحالي ==="',
        'pm2 list',
    ].join(' && ');
    conn.exec(cmds, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
