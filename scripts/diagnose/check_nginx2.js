const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = [
        // See how n1 nginx is configured
        'ls /www/server/panel/vhost/nginx/ | grep -i "n1\\|nama"',
        'echo ---n1 conf---',
        'cat /www/server/panel/vhost/nginx/n1.namainvist.com.conf 2>/dev/null | head -40',
        'echo ---namainvest conf---',
        'cat /www/server/panel/vhost/nginx/namainvest.namainvist.com.conf 2>/dev/null | head -40 || echo "NO CONF FILE"',
        'echo ---nginx includes---',
        'ls /www/server/panel/vhost/nginx/proxy/n1.namainvist.com/ 2>/dev/null',
    ].join(' && ');
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
