const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

console.log('🔄 Uploading fixed Sidebar.tsx to N11...');

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        sftp.fastPut('c:\\Users\\1\\Desktop\\alfa\\src\\components\\Sidebar.tsx', '/www/wwwroot/n11.namainvist.com/src/components/Sidebar.tsx', (err) => {
            if (err) throw err;
            console.log('✅ Uploaded Sidebar.tsx');
            
            conn.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11', (err, stream) => {
                stream.on('close', () => {
                    conn.end();
                    console.log('🏁 Build and restart completed.');
                }).on('data', (d) => process.stdout.write(d.toString()))
                  .stderr.on('data', (d) => process.stderr.write(d.toString()));
            });
        });
    });
}).on('error', (err) => {
    console.error('❌ Error:', err);
}).connect(config);
