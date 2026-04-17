const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = [
        // Check nginx config for namainvest
        'cat /www/server/panel/vhost/nginx/proxy/namainvest.namainvist.com/proxy.conf 2>/dev/null || echo "NO PROXY CONFIG"',
        'echo ---',
        // Check if nginx site config exists
        'ls /www/server/panel/vhost/nginx/ | grep namainvest',
        'echo ---',
        // Check what nginx is actually sending for namainvest domain
        'nginx -T 2>/dev/null | grep -A 15 "namainvest.namainvist.com" | head -30',
    ].join(' && ');
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
