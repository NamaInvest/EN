const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const BASE = '/www/wwwroot/n3.namainvist.com';

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        console.log('Uploading shifts page.tsx...');
        sftp.fastPut('c:/Users/1/Desktop/alfa/src/app/(dashboard)/shifts/page.tsx', `${BASE}/src/app/(dashboard)/shifts/page.tsx`, {}, (err) => {
            if (err) console.error('Upload page.tsx error:', err);
            console.log('Uploading shifts route.ts...');
            sftp.fastPut('c:/Users/1/Desktop/alfa/src/app/api/shifts/route.ts', `${BASE}/src/app/api/shifts/route.ts`, {}, (err) => {
                if (err) console.error('Upload route.ts error:', err);
                
                console.log('Rebuilding N3...');
                conn.exec(`cd ${BASE} && npm run build 2>&1 | tail -n 10 && pm2 restart n3`, (err, stream) => {
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.on('close', () => conn.end());
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
