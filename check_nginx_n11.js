const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

console.log('🔄 Checking nginx config for N11...');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cat /www/server/panel/vhost/nginx/n11.namainvist.com.conf', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end());
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).on('error', console.error).connect(config);
