const { Client } = require('ssh2');
const conn = new Client();

const DOMAIN = 'namainvest.namainvist.com';
const PORT = 3013;

conn.on('ready', () => {
    const cmd = [
        // Test aaPanel nginx syntax and reload
        '/www/server/nginx/sbin/nginx -t -c /www/server/nginx/conf/nginx.conf 2>&1',
        'echo ---',
        '/www/server/nginx/sbin/nginx -s reload -c /www/server/nginx/conf/nginx.conf && echo AAPANEL_RELOADED',
        'echo ---',
        // Verify conf is loaded now
        '/www/server/nginx/sbin/nginx -T -c /www/server/nginx/conf/nginx.conf 2>/dev/null | grep "namainvest" | head -5',
        'echo ---',
        // Test via localhost (aaPanel nginx is on port 80/443 of the server)
        'sleep 1 && curl -s --resolve "' + DOMAIN + ':80:127.0.0.1" http://' + DOMAIN + '/api/auth/login -X POST -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin"}\' | head -100',
    ].join(' && ');
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
