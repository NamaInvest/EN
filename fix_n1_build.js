const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to N1. Starting build...');
    conn.exec('cd /www/wwwroot/n1.namainvist.com && npm install && npm run build && pm2 restart nama-main', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Build script completed with code ' + code);
            conn.end();
        }).on('data', data => {
            process.stdout.write(data.toString());
        }).stderr.on('data', data => {
            process.stderr.write(data.toString());
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
