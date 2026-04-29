const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = [
        // Find THE actual nginx binary
        'which nginx && nginx -v',
        'echo ---',
        // aaPanel might use its own nginx
        'ls /www/server/nginx/ 2>/dev/null | head -5',
        '/www/server/nginx/sbin/nginx -v 2>&1 || echo "no aapanel nginx"',
        'echo ---',
        '/www/server/nginx/sbin/nginx -T 2>/dev/null | grep "Configuration file" | head -5',
        'echo ---',
        '/www/server/nginx/sbin/nginx -T 2>/dev/null | grep -c "n1.namainvist"',
        'echo ---',
        'ps aux | grep nginx | head -5',
    ].join(' && ');
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
