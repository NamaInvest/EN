const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
        echo "=== NGINX SITES-ENABLED N2 ===" && cat /etc/nginx/sites-enabled/n2.namainvist.com &&
        echo "" &&
        echo "=== AAPANEL VHOST ===" && cat /www/server/panel/vhost/nginx/n2.namainvist.com.conf 2>/dev/null | grep -E "proxy_pass|listen|server_name"
    `, (err, stream) => {
        let data = '';
        stream.on('data', d => data += d);
        stream.stderr.on('data', d => data += d);
        stream.on('close', () => {
            console.log(data);
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
