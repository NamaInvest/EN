const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '185.197.195.202', // N11 Server
    port: 22,
    username: 'root',
    privateKey: fs.readFileSync('C:\\Users\\1\\.ssh\\id_ed25519_deploy'),
    readyTimeout: 30000
};

console.log('🔄 Connecting to check status...');

const conn = new Client();
conn.on('ready', () => {
    conn.exec(`pm2 status && pm2 logs n11 --nostream --lines 20`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.end();
        }).on('data', (data) => process.stdout.write(data.toString()))
          .stderr.on('data', (data) => process.stderr.write(data.toString()));
    });
}).on('error', (err) => {
    console.error('❌ Error:', err);
}).connect(config);
