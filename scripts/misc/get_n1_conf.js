const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = [
        'cat /www/server/panel/vhost/rewrite/node_n1.conf 2>/dev/null',
        'echo ---certs---',
        'ls /www/server/panel/vhost/cert/ | grep -i "nama\\|wild"',
        'echo ---n1 full conf---',
        'cat /www/server/panel/vhost/nginx/n1.namainvist.com.conf',
    ].join(' && ');
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
