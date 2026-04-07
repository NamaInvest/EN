const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
        echo "=== PM2 LIST FULL ===" &&
        pm2 list --no-color &&
        echo "=== ALL NEXT PORTS ===" &&
        ss -tlnp 2>/dev/null | grep next-server &&
        echo "=== NGINX FOR N2 ===" &&
        find /www/server/nginx/vhost/ -name "*n2*namainvist*" 2>/dev/null -exec echo "FILE: {}" \\; -exec cat {} \\; 2>/dev/null &&
        echo "=== N2 .ENV PORT ===" &&
        grep -E "PORT|port" /www/wwwroot/n2.namainvist.com/.env 2>/dev/null | head -5
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
