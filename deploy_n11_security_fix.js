const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 };
const basePath = '/www/wwwroot/n11.namainvist.com/';

const filesToUpload = [
    'src/lib/api-handler.ts',
    'src/lib/validations.ts',
    'src/app/api/treasury/route.ts',
    'src/app/api/expenses/route.ts'
];

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ تم الاتصال بنجاح!');
    conn.exec(`mkdir -p /www/wwwroot/n11.namainvist.com/src/lib /www/wwwroot/n11.namainvist.com/src/app/api/treasury /www/wwwroot/n11.namainvist.com/src/app/api/expenses`, (err, stream) => {
        stream.on('close', () => {
            conn.sftp((err, sftp) => {
                let uploaded = 0;
                filesToUpload.forEach(relPath => {
                    const localFile = path.join(__dirname, relPath);
                    const remoteFile = basePath + relPath.replace(/\\/g, '/');
                    sftp.fastPut(localFile, remoteFile, (err) => {
                        if (err) throw err;
                        console.log(`✅ تم رفع ${relPath}`);
                        uploaded++;
                        if (uploaded === filesToUpload.length) {
                            console.log('⏳ جاري إعادة بناء المشروع (Next.js Build) وإعادة تشغيل N11...');
                            conn.exec(`cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11`, (err, stream) => {
                                stream.on('close', () => {
                                    console.log('🚀 تمت عملية البناء وإعادة التشغيل بنجاح مدوي!');
                                    conn.end();
                                }).on('data', (data) => process.stdout.write(data.toString()))
                                  .stderr.on('data', (data) => process.stderr.write(data.toString()));
                            });
                        }
                    });
                });
            });
        });
    });
}).connect(config);
