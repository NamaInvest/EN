const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    // Read the actual NGINX config for namainvist.com to understand routing
    conn.exec("cat /www/server/panel/vhost/nginx/namainvist.com.conf", (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            console.log('NGINX CONFIG:');
            console.log(out);
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
