const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
};

console.log('🔄 Checking build output...');

const conn = new Client();
conn.on('ready', () => {
    // Run string find on the sidebar component to confirm it uploaded
    conn.exec(`cat /www/wwwroot/n11.namainvist.com/src/components/Sidebar.tsx | grep "isManual"`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.end();
        }).on('data', (data) => process.stdout.write(data.toString()))
          .stderr.on('data', (data) => process.stderr.write(data.toString()));
    });
}).on('error', (err) => {
    console.error('❌ Error:', err);
}).connect(config);
