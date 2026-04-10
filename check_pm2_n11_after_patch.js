const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

console.log('🔄 Checking pm2...');

const conn = new Client();
conn.on('ready', () => {
    conn.exec(`pm2 status n11`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.end();
            console.log('🏁 Search completed.');
        }).on('data', (data) => process.stdout.write(data.toString()))
          .stderr.on('data', (data) => process.stderr.write(data.toString()));
    });
}).on('error', (err) => {
    console.error('❌ Error:', err);
}).connect(config);
