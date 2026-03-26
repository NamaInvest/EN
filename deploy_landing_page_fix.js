const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- TRANSMITTING THE PATCHED MASTER LANDING PAGE ---');
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const localPath = 'src/app/page.tsx';
        sftp.fastPut(localPath, '/www/wwwroot/namainvist.com/src/app/page.tsx', (err1) => {
            if(err1) throw err1;
            
            const bashScript = `
#!/bin/bash
cd /www/wwwroot/namainvist.com
npm run build
pm2 restart nama-main
            `;
            
            conn.exec(bashScript, (execErr, stream) => {
                if (execErr) throw execErr;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => {
                    console.log('✅ PATCHED LANDING PAGE LIVE ON PORT 3000.');
                    conn.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
