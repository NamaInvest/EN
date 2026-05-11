const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
        sed -i "s/127.0.0.1:3002/127.0.0.1:3500/g" /www/server/panel/vhost/nginx/tenants-wildcard.namainvist.com.conf &&
        nginx -t && nginx -s reload
    `;
    conn.exec(cmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
