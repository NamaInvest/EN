const { Client } = require('ssh2');
const fs = require('fs');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

console.log('🔄 Uploading with strict SFTP...');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;

        const files = [
            { l: 'd:\\namasoft9-3-main\\src\\app\\api\\purchases\\route.ts', r: '/www/wwwroot/n11.namainvist.com/src/app/api/purchases/route.ts' },
            { l: 'd:\\namasoft9-3-main\\src\\app\\(dashboard)\\purchases\\page.tsx', r: '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/purchases/page.tsx' },
            { l: 'd:\\namasoft9-3-main\\src\\app\\(dashboard)\\purchases\\options\\page.tsx', r: '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/purchases/options/page.tsx' },
            { l: 'd:\\namasoft9-3-main\\src\\app\\(dashboard)\\reports\\manual-purchases\\page.tsx', r: '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/reports/manual-purchases/page.tsx' }
        ];

        const mkdir = (dir) => new Promise(res => sftp.mkdir(dir, () => res())); // Ignore errors if it exists

        (async () => {
            await mkdir('/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/purchases/options');
            await mkdir('/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/reports/manual-purchases');

            for (const {l, r} of files) {
                console.log('Uploading', r);
                await new Promise((res, rej) => sftp.fastPut(l, r, e => e ? rej(e) : res()));
            }

            console.log('✨ Calling build ...');
            conn.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11', (err, stream) => {
                stream.on('close', () => {
                    console.log('🎉 Deploy complete!');
                    conn.end();
                }).on('data', d => process.stdout.write(d.toString()))
                  .stderr.on('data', d => process.stderr.write(d.toString()));
            });
        })();
    });
}).on('error', console.error).connect(config);
