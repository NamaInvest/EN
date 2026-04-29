const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

console.log('🔄 Downloading n11 translations.ts...');

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        sftp.fastGet('/www/wwwroot/n11.namainvist.com/src/lib/translations.ts', 'c:\\Users\\1\\Desktop\\alfa\\translations_n11.ts', (err) => {
            if (err) throw err;
            console.log('✅ Downloaded n11 translations');
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('❌ Error:', err);
}).connect(config);
