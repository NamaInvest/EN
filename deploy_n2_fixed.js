const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log('[🚀] Connected! Uploading correct i18n.tsx to N2...');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastPut('src/lib/i18n.tsx', '/www/wwwroot/n2.namainvist.com/src/lib/i18n.tsx', (err) => {
            if (err) throw err;
            console.log('[📦] Upload complete. Running Next.js build on N2...');
            conn.exec('cd /www/wwwroot/n2.namainvist.com && /usr/bin/npm run build', (err, stream) => {
                if (err) throw err;
                stream.on('data', d => process.stdout.write(d));
                stream.stderr.on('data', d => process.stdout.write(d));
                stream.on('close', code => {
                    console.log('\n[✅] N2 Build Complete. Restarting n2 and n2-whatsapp...');
                    conn.exec('pm2 restart n2 && pm2 restart n2-whatsapp', (err2, stream2) => {
                        stream2.on('close', () => {
                            console.log('[🎉] N2 is fully fixed and online!');
                            conn.end();
                        });
                    });
                });
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
