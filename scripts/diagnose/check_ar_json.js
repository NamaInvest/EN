const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

console.log('🔄 Checking ar.json on N11...');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastGet('/www/wwwroot/n11.namainvist.com/src/locales/ar.json', 'c:\\Users\\1\\Desktop\\alfa\\ar_n11_check.json', (err) => {
            conn.end();
            if (err) console.error(err);
            else console.log('✅ Downloaded');
        });
    });
}).on('error', console.error).connect(config);
