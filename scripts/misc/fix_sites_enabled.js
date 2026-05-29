const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = [
        // Check what's in sites-enabled (symlinks or real files?)
        'ls -la /etc/nginx/sites-enabled/',
        'echo ---',
        // Check n1 in sites-enabled
        'cat /etc/nginx/sites-enabled/n11.namainvist.com | grep -E "proxy_pass|server_name|listen" | head -10',
        'echo ---',
        // Copy our conf to sites-enabled
        'cp /www/server/panel/vhost/nginx/namainvest.namainvist.com.conf /etc/nginx/sites-enabled/namainvest.namainvist.com',
        'nginx -t 2>&1 && nginx -s reload && echo RELOADED',
        'echo ---test---',
        'curl -s --resolve "namainvest.namainvist.com:80:127.0.0.1" http://namainvest.namainvist.com/api/auth/login -X POST -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin"}\' | head -100',
    ].join(' && ');
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
