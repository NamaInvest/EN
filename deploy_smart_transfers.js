const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

console.log('🔄 Uploading all updated files...');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;

        const filesToUpload = [
            { l: 'd:\\namasoft9-3-main\\src\\app\\(dashboard)\\smart-transfers\\page.tsx', r: '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/smart-transfers/page.tsx' },
            { l: 'd:\\namasoft9-3-main\\src\\app\\api\\smart-transfers\\route.ts', r: '/www/wwwroot/n11.namainvist.com/src/app/api/smart-transfers/route.ts' },
            { l: 'd:\\namasoft9-3-main\\src\\lib\\auto-journal.ts', r: '/www/wwwroot/n11.namainvist.com/src/lib/auto-journal.ts' }
        ];

        let completed = 0;
        filesToUpload.forEach(f => {
            sftp.fastPut(f.l, f.r, (err) => {
                if (err) {
                    console.error('Failed to upload', f.l, err);
                } else {
                    console.log('✅ Uploaded', f.l);
                }
                completed++;
                if (completed === filesToUpload.length) {
                    console.log('✅ All files uploaded. Proceeding to build...');
                    conn.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11', (err, stream) => {
                        if (err) throw err;
                        stream.on('close', () => {
                            console.log('🎉 Remote build and restart finished.');
                            conn.end();
                        }).on('data', d => process.stdout.write(d.toString()))
                          .stderr.on('data', d => process.stderr.write(d.toString()));
                    });
                }
            });
        });
    });
}).on('error', console.error).connect(config);
