const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

console.log('🔄 Downloading n11 Sidebar.tsx...');

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        sftp.fastGet('/www/wwwroot/n11.namainvist.com/src/components/Sidebar.tsx', 'd:\\namasoft9-3-main\\Sidebar_n11_check.tsx', (err) => {
            if (err) throw err;
            console.log('✅ Downloaded n11 Sidebar.tsx');
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('❌ Error:', err);
}).connect(config);
