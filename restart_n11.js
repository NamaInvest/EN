const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '185.197.195.202', // N11 Server
    port: 22,
    username: 'root',
    privateKey: fs.readFileSync('C:\\Users\\1\\.ssh\\id_ed25519_deploy'),
    readyTimeout: 30000
};

console.log('🔄 Restarting namasoft...');

const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cd /www/wwwroot/n11.namainvist.com && pm2 restart namasoft && pm2 logs namasoft --nostream --lines 15`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.end();
        }).on('data', (data) => process.stdout.write(data.toString()))
          .stderr.on('data', (data) => process.stderr.write(data.toString()));
    });
}).on('error', (err) => {
    console.error('❌ Error:', err);
}).connect(config);
