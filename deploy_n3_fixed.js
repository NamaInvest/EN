const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log('[🚀] Connected! Uploading correct i18n.tsx to N3...');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastPut('src/lib/i18n.tsx', '/www/wwwroot/n3.namainvist.com/src/lib/i18n.tsx', (err) => {
            if (err) throw err;
            console.log('[📦] Upload complete. Cleaning up WhatsApp auth and running Next.js build on N3...');
            conn.exec('pkill -f chrome || true; pkill -f chromium || true; pkill -f puppeteer || true; rm -rf /www/wwwroot/n3.namainvist.com/.wwebjs_auth; cd /www/wwwroot/n3.namainvist.com && /usr/bin/npm run build', (err, stream) => {
                if (err) throw err;
                stream.on('data', d => process.stdout.write(d));
                stream.stderr.on('data', d => process.stdout.write(d));
                stream.on('close', code => {
                    console.log('\n[✅] N3 Build Complete. Restarting n3 and n3-whatsapp...');
                    conn.exec('pm2 restart n3 && pm2 restart n3-whatsapp', (err2, stream2) => {
                        stream2.on('close', () => {
                            console.log('[🎉] N3 is fully fixed and online!');
                            conn.end();
                        });
                    });
                });
            });
        });
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
