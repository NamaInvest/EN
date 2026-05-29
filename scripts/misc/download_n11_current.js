const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
};

console.log('🔄 Downloading n11 Sidebar.tsx (AGAIN)...');

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        sftp.fastGet('/www/wwwroot/n11.namainvist.com/src/components/Sidebar.tsx', 'c:\\Users\\1\\Desktop\\alfa\\Sidebar_n11_CURRENT.tsx', (err) => {
            if (err) throw err;
            console.log('✅ Downloaded n11 Sidebar.tsx CURRENT');
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('❌ Error:', err);
}).connect(config);
