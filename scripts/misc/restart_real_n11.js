const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
};

console.log('🔄 Triggering pm2 restart on n11...');

const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cd /www/wwwroot/n11.namainvist.com && pm2 restart n11 && pm2 logs n11 --nostream --lines 10`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.end();
            console.log('🏁 Restart completed.');
        }).on('data', (data) => process.stdout.write(data.toString()))
          .stderr.on('data', (data) => process.stderr.write(data.toString()));
    });
}).on('error', (err) => {
    console.error('❌ Error:', err);
}).connect(config);
