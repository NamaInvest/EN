const { Client } = require('ssh2');
const path = require('path');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

console.log('🔄 Uploading missing pages and API routes...');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;

        const filesToUpload = [
            'src/app/api/purchases/route.ts',
            'src/app/(dashboard)/purchases/page.tsx',
            'src/app/(dashboard)/purchases/options/page.tsx',
            'src/app/(dashboard)/reports/manual-purchases/page.tsx'
        ];

        conn.exec('mkdir -p /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/purchases/options && mkdir -p /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/reports/manual-purchases', (err, stream) => {
            if (err) throw err;
            stream.on('close', async () => {
                let successCount = 0;
                for (const f of filesToUpload) {
                    const localFile = 'd:\\namasoft9-3-main\\' + f.replace(/\//g, '\\');
                    const remoteFile = `/www/wwwroot/n11.namainvist.com/${f}`;
                    await new Promise((res, rej) => {
                        sftp.fastPut(localFile, remoteFile, (err) => {
                            if (err) {
                                console.error(`❌ Failed to upload ${f}:`, err);
                                rej(err);
                            } else {
                                console.log(`✅ Uploaded ${f}`);
                                successCount++;
                                res();
                            }
                        });
                    });
                }

                if (successCount === filesToUpload.length) {
                    console.log('🏁 All files uploaded. Starting build...');
                    conn.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11', (err, bStream) => {
                        bStream.on('close', () => {
                            conn.end();
                            console.log('✅ Build and restart complete.');
                        }).on('data', d => process.stdout.write(d.toString()))
                          .stderr.on('data', d => process.stderr.write(d.toString()));
                    });
                } else {
                    conn.end();
                }
            });
        });
    });
}).on('error', console.error).connect(config);
