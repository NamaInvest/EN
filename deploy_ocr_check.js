const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) { conn.end(); return; }

        const local = path.join(__dirname, 'src/app/api/purchases/ocr/route.ts');
        const remote = '/www/wwwroot/n11.namainvist.com/src/app/api/purchases/ocr/route.ts';

        sftp.fastPut(local, remote, (err) => {
            sftp.end();
            if (err) { console.error('Upload failed:', err); conn.end(); return; }
            console.log('Uploaded OCR route');

            // Check what key is in N11 database
            const checkCmd = `
cd /www/wwwroot/n11.namainvist.com
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.setting.findUnique({ where: { key: 'gemini_api_key' } }).then(r => {
    if (r) console.log('KEY_FOUND:', r.value.slice(0,15) + '...');
    else console.log('KEY_NOT_FOUND_IN_DB');
    p.\\$disconnect();
}).catch(e => console.error('DB_ERROR:', e.message));
" 2>&1
            `;

            conn.exec(checkCmd, (err, stream) => {
                if (err) { conn.end(); return; }
                stream.on('data', d => process.stdout.write(d));
                stream.stderr.on('data', d => process.stderr.write(d));
                stream.on('close', () => {
                    // Rebuild N11
                    conn.exec('cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart n11 && echo "DONE"', (err, s2) => {
                        if (err) { conn.end(); return; }
                        s2.on('data', d => process.stdout.write(d));
                        s2.stderr.on('data', d => process.stderr.write(d));
                        s2.on('close', () => conn.end());
                    });
                });
            });
        });
    });
}).connect({
    host: '46.4.188.170', port: 22,
    username: 'root', password: '_ee4SWbxLVfH9b'
});
