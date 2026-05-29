const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Get aaPanel nginx config and check proxy_pass port
    conn.exec(`cat /www/server/panel/vhost/nginx/n2.namainvist.com.conf`, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.stderr.on('data', d => data += d);
        stream.on('close', () => {
            console.log('NGINX CONFIG:\n', data);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
