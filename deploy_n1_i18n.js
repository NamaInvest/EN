const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log('[🚀] Connected! Uploading correct i18n.tsx to N1...');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastPut('src/lib/i18n.tsx', '/www/wwwroot/n1.namainvist.com/src/lib/i18n.tsx', (err) => {
            if (err) throw err;
            console.log('[📦] Upload complete. Running npm run build on N1...');
            conn.exec('cd /www/wwwroot/n1.namainvist.com && /usr/bin/npm run build && pm2 restart n1', (err, stream) => {
                if (err) throw err;
                stream.on('data', d => console.log('STDOUT: ' + d.toString().trim()));
                stream.stderr.on('data', d => console.log('STDERR: ' + d.toString().trim()));
                stream.on('close', code => {
                    console.log('[✅] N1 Deploy Complete. Exit code:', code);
                    conn.end();
                });
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
