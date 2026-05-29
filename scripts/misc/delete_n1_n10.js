const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = [
        'echo "🗑️ [1] حذف PM2 processes n1-n10..."',
        'pm2 stop n1-main n2 n3 n4 n5 n6 n7 n8 n9 n10 2>/dev/null || true',
        'pm2 delete n1-main n2 n3 n4 n5 n6 n7 n8 n9 n10 2>/dev/null || true',
        'pm2 save --force',
        'echo "✅ PM2 done"',

        'echo "🗑️ [2] حذف مجلدات n1-n10..."',
        'rm -rf /www/wwwroot/n1.namainvist.com',
        'rm -rf /www/wwwroot/n2.namainvist.com',
        'rm -rf /www/wwwroot/n3.namainvist.com',
        'rm -rf /www/wwwroot/n4.namainvist.com',
        'rm -rf /www/wwwroot/n5.namainvist.com',
        'rm -rf /www/wwwroot/n6.namainvist.com',
        'rm -rf /www/wwwroot/n7.namainvist.com',
        'rm -rf /www/wwwroot/n8.namainvist.com',
        'rm -rf /www/wwwroot/n9.namainvist.com',
        'rm -rf /www/wwwroot/n10.namainvist.com',
        'echo "✅ Directories done"',

        'echo "🗑️ [3] حذف قواعد البيانات n1-n10..."',
        'for db in n1_db n2_db n3_db n4_db n5_db n6_db n7_db n8_db n9_db n10_db; do sudo -u postgres psql -c "DROP DATABASE IF EXISTS $db;" 2>/dev/null; echo "  Dropped: $db"; done',
        'echo "✅ Databases done"',

        'echo "🗑️ [4] حذف Nginx configs..."',
        'rm -f /www/server/panel/vhost/nginx/n1.namainvist.com.conf',
        'rm -f /www/server/panel/vhost/nginx/n2.namainvist.com.conf',
        'rm -f /www/server/panel/vhost/nginx/n3.namainvist.com.conf',
        'rm -f /www/server/panel/vhost/nginx/n4.namainvist.com.conf',
        'rm -f /www/server/panel/vhost/nginx/n5.namainvist.com.conf',
        'rm -f /www/server/panel/vhost/nginx/n6.namainvist.com.conf',
        'rm -f /www/server/panel/vhost/nginx/n7.namainvist.com.conf',
        'rm -f /www/server/panel/vhost/nginx/n8.namainvist.com.conf',
        'rm -f /www/server/panel/vhost/nginx/n9.namainvist.com.conf',
        'rm -f /www/server/panel/vhost/nginx/n10.namainvist.com.conf',
        'echo "✅ Nginx configs done"',

        'echo "🔄 [5] إعادة تحميل Nginx..."',
        '/www/server/nginx/sbin/nginx -t -c /www/server/nginx/conf/nginx.conf 2>&1 && /www/server/nginx/sbin/nginx -s reload -c /www/server/nginx/conf/nginx.conf',
        'echo "✅ Nginx reloaded"',

        'echo "🗑️ [6] حذف الـ Logs..."',
        'rm -f /www/wwwlogs/n1.* /www/wwwlogs/n2.* /www/wwwlogs/n3.* /www/wwwlogs/n4.* /www/wwwlogs/n5.*',
        'rm -f /www/wwwlogs/n6.* /www/wwwlogs/n7.* /www/wwwlogs/n8.* /www/wwwlogs/n9.* /www/wwwlogs/n10.*',
        'echo "✅ Logs done"',

        'echo ""',
        'echo "=== ✅ VERIFICATION ==="',
        'pm2 list | grep -E "n[0-9]" || echo "PM2: نظيف ✅"',
        'ls /www/wwwroot/*.namainvist.com -d 2>/dev/null',
        'sudo -u postgres psql -tAc "SELECT datname FROM pg_database WHERE datname SIMILAR TO \'n[0-9]+_db\' ORDER BY datname;" 2>/dev/null',
        'ls /www/server/panel/vhost/nginx/n*.conf 2>/dev/null | grep -v n11 || echo "Nginx: نظيف ✅"',
        'echo ""',
        'echo "💾 مساحة تحررت:"',
        'df -h /www/wwwroot/',
        'echo "=== انتهى الحذف بنجاح ==="',
    ].join(' && ');

    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => {
            console.log('\n✅ الحذف اكتمل — جاهز للمرحلة التالية');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
