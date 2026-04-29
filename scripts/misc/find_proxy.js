const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Find proxy_pass in all nginx configs for n2
    conn.exec(`
        grep -r "proxy_pass" /www/server/panel/vhost/ 2>/dev/null | grep n2
        echo "---"
        grep -r "proxy_pass" /etc/nginx/ 2>/dev/null | grep n2
        echo "---REWRITE---"
        cat /www/server/panel/vhost/rewrite/n2.namainvist.com.conf 2>/dev/null
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
