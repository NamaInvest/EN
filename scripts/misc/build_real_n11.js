const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
};

console.log('🔄 Triggering build and streaming...');

const conn = new Client();
conn.on('ready', () => {
    // Run npm run build and show output directly
    conn.exec(`cd /www/wwwroot/n11.namainvist.com && npm run build`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.end();
            console.log('🏁 Build completed (or failed).');
        }).on('data', (data) => process.stdout.write(data.toString()))
          .stderr.on('data', (data) => process.stderr.write(data.toString()));
    });
}).on('error', (err) => {
    console.error('❌ Error:', err);
}).connect(config);
