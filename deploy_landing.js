const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

const localFile = path.join(__dirname, 'src/app/page.tsx');
const remoteFile = '/www/wwwroot/namainvist.com/src/app/page.tsx';

conn.on('ready', () => {
    console.log('--- CONNECTING TO HETZNER. DEPLOYING LANDING PAGE ---');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        sftp.fastPut(localFile, remoteFile, (putErr) => {
            if (putErr) {
                console.error('FAILED TO PUT: ', putErr);
                conn.end();
                return;
            }
            console.log('✅ Injected `page.tsx` UI.');
            
            // Build and reload
            const bashScript = `
cd /www/wwwroot/namainvist.com
npm run build
pm2 reload nama-main
            `;
            conn.exec(bashScript, (execErr, stream) => {
                if(execErr) throw execErr;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => {
                    console.log('✅ Premium Landing Page live on Port 2999 -> namainvist.com');
                    conn.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
