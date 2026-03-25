const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
        echo "=== NGINX CONF ==="
        cat /www/server/panel/vhost/nginx/namainvist.com.conf
        echo "\n=== NGINX ERROR LOG ==="
        tail -n 15 /www/wwwlogs/namainvist.com.error.log 2>/dev/null
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log(data.toString()))
              .stderr.on('data', data => console.error(data.toString()));
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
