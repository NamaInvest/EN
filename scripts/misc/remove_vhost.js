const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('rm -f /www/server/panel/vhost/nginx/namainvest.namainvist.com.conf; /www/server/nginx/sbin/nginx -s reload', (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
