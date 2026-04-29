const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const tenants = ['n1','n2','n3','n4','n5','n6','n7','n8','n9','n10'];
    
    const cmds = [
        // إزالة الصلاحية الخاصة من .user.ini ثم الحذف
        ...tenants.map(t => [
            `chattr -i /www/wwwroot/${t}.namainvist.com/.user.ini 2>/dev/null || true`,
            `chattr -i /www/wwwroot/${t}.namainvist.com/* 2>/dev/null || true`,
            `rm -rf /www/wwwroot/${t}.namainvist.com`,
            `echo "✅ Deleted dir: ${t}"`,
        ].join(' && ')),

        // حذف قواعد البيانات
        ...tenants.map(t => `sudo -u postgres psql -c "DROP DATABASE IF EXISTS ${t}_db;" 2>/dev/null && echo "✅ Dropped DB: ${t}_db"`),

        // حذف nginx
        ...tenants.map(t => `rm -f /www/server/panel/vhost/nginx/${t}.namainvist.com.conf && echo "✅ Nginx: ${t}"`),

        // إعادة تحميل nginx
        '/www/server/nginx/sbin/nginx -t -c /www/server/nginx/conf/nginx.conf 2>&1 && /www/server/nginx/sbin/nginx -s reload',
        'echo "✅ Nginx reloaded"',

        // التحقق النهائي
        'echo ""',
        'echo "=== FINAL VERIFICATION ==="',
        'ls /www/wwwroot/ | grep -v n11',
        'sudo -u postgres psql -tAc "SELECT datname FROM pg_database WHERE datname SIMILAR TO \'n[0-9]+_db\' ORDER BY datname;" 2>/dev/null | grep -v n11 || echo "All n1-n10 DBs: CLEAN ✅"',
        'ls /www/server/panel/vhost/nginx/n*.conf 2>/dev/null | grep -v n11 || echo "Nginx n1-n10: CLEAN ✅"',
        'df -h /www/wwwroot/ | tail -1',
    ];

    conn.exec(cmds.join(' && '), (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 });
