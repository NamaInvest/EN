const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = [
        // Check main nginx.conf include paths
        'cat /etc/nginx/nginx.conf | grep include',
        'echo ---',
        // Check what the vhost directory looks like
        'cat /www/server/panel/vhost/nginx/namainvest.namainvist.com.conf | head -10',
        'echo ---',
        // Check if the conf is being loaded by nginx
        'nginx -T 2>/dev/null | grep -c "namainvest"',
        'echo ---',
        // Test with proper Host header on port 443 directly
        'curl -sk --resolve "namainvest.namainvist.com:443:127.0.0.1" https://namainvest.namainvist.com/api/auth/login -X POST -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin"}\' | head -100',
    ].join(' && ');
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
