const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`curl -s ifconfig.me && echo "" && hostname && echo "=== AAPANEL CONF ===" && cat /www/server/panel/vhost/nginx/n2.namainvist.com.conf | grep proxy_pass`, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.stderr.on('data', d => data += d);
        stream.on('close', () => {
            console.log(data);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
