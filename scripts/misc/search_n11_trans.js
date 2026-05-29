const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
};

console.log('🔄 Searching translations...');

const conn = new Client();
conn.on('ready', () => {
    conn.exec(`grep -r "sys.str_3501" /www/wwwroot/n11.namainvist.com/src/lib/translations.ts`, (err, stream) => {
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
