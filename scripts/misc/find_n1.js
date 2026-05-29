const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = [
        // Where is n1 nginx served from?
        'grep -r "n1.namainvist.com" /etc/nginx/ 2>/dev/null | grep "server_name" | head -5',
        'echo ---',
        'ls /etc/nginx/conf.d/',
        'echo ---',
        'cat /etc/nginx/conf.d/default.conf 2>/dev/null | head -5 || echo "no default.conf"',
        'echo ---',
        // Try ALL directories that could have nginx configs
        'find /etc/nginx/ -name "*.conf" | xargs grep -l "n1.namainvist.com" 2>/dev/null',
        'echo ---',
        'nginx -T 2>/dev/null | grep "Configuration file" | head -20',
    ].join(' && ');
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
