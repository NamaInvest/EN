const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

conn.on('ready', () => {
    console.log('Connected...');
    conn.sftp((err, sftp) => {
        if (err) { console.error(err); conn.end(); return; }

        const local = path.join(__dirname, 'src/components/Sidebar.tsx');
        const remote = '/www/wwwroot/n1.namainvist.com/src/components/Sidebar.tsx';

        sftp.fastPut(local, remote, (err) => {
            if (err) { console.error('Upload failed:', err); conn.end(); return; }
            console.log('Uploaded Sidebar.tsx');
            sftp.end();

            // Build and restart
            conn.exec('cd /www/wwwroot/n1.namainvist.com && npm run build && pm2 restart n1-main && pm2 save && echo "BUILD_OK"', (err, stream) => {
                if (err) { conn.end(); return; }
                stream.on('data', d => process.stdout.write(d));
                stream.stderr.on('data', d => process.stderr.write(d));
                stream.on('close', () => {
                    console.log('\nDone!');
                    conn.end();
                });
            });
        });
    });
}).connect({
    host: '46.4.188.170', port: 22,
    username: 'root', password: '_ee4SWbxLVfH9b'
});
