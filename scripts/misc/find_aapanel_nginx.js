const { Client } = require('ssh2');
const conn = new Client();

const DOMAIN = 'namainvest.namainvist.com';
const PORT = 3013;

conn.on('ready', () => {
    const cmd = [
        // Check aaPanel nginx include paths
        'cat /www/server/nginx/conf/nginx.conf | grep include',
        'echo ---',
        // Where does it include vhosts?
        '/www/server/nginx/sbin/nginx -T -c /www/server/nginx/conf/nginx.conf 2>/dev/null | grep "Configuration file" | head -15',
        'echo ---',
        // The vhost conf location
        '/www/server/nginx/sbin/nginx -T -c /www/server/nginx/conf/nginx.conf 2>/dev/null | grep "n1.namainvist" | head -5',
    ].join(' && ');
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
