const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = [
        // Find where n1 conf is actually loaded from
        'nginx -T 2>/dev/null | grep -B2 "n1.namainvist.com" | head -10',
        'echo ---',
        // Check conf.d
        'ls /etc/nginx/conf.d/ | head -10',
        'echo ---',
        // Check sites-enabled
        'ls /etc/nginx/sites-enabled/ | head -10',
        'echo ---',
        // Check aaPanel nginx conf include
        'cat /etc/nginx/conf.d/default.conf 2>/dev/null | grep include | head -10',
        // Find where n1 nginx conf is actually referenced
        'grep -r "n1.namainvist.com" /etc/nginx/ 2>/dev/null | head -5',
    ].join(' && ');
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
