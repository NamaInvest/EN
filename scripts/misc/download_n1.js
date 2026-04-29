const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

console.log('🔄 Downloading n1 Sidebar.tsx...');

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        sftp.fastGet('/www/wwwroot/n1.namainvist.com/src/components/Sidebar.tsx', 'c:\\Users\\1\\Desktop\\alfa\\Sidebar_n1.tsx', (err) => {
            if (err) throw err;
            console.log('✅ Downloaded n1 Sidebar.tsx');
            
            sftp.fastGet('/www/wwwroot/n1.namainvist.com/src/app/(dashboard)/purchases/page.tsx', 'c:\\Users\\1\\Desktop\\alfa\\PurchasesPage_n1.tsx', (err) => {
                if (err) throw err;
                console.log('✅ Downloaded n1 Purchases page.tsx');
                conn.end();
            });
        });
    });
}).on('error', (err) => {
    console.error('❌ Error:', err);
}).connect(config);
