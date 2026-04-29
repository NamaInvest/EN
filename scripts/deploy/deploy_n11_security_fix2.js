const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 };
const basePath = '/www/wwwroot/n11.namainvist.com/';

const filesToUpload = [
    'src/lib/validations.ts',         // Updated Zod schemas (all financial entities)
    'src/lib/api-handler.ts',         // Global error handler (no change needed, already deployed)
    'src/app/api/purchases/route.ts',
    'src/app/api/purchase-returns/route.ts',
    'src/app/api/sales-returns/route.ts',
    'src/app/api/salaries/route.ts',
    'src/app/api/treasury/balance/route.ts',
];

console.log(`🔄 رفع ${filesToUpload.length} ملفات إلى N11...`);
const conn = new Client();
conn.on('ready', () => {
    console.log('✅ تم الاتصال!');
    const mkdirCmd = [
        'src/lib',
        'src/app/api/purchases',
        'src/app/api/purchase-returns',
        'src/app/api/sales-returns',
        'src/app/api/salaries',
        'src/app/api/treasury/balance',
    ].map(d => `mkdir -p ${basePath}${d}`).join(' && ');

    conn.exec(mkdirCmd, (err, stream) => {
        stream.on('close', () => {
            conn.sftp((err, sftp) => {
                let uploaded = 0;
                filesToUpload.forEach(relPath => {
                    const localFile = path.join(__dirname, relPath);
                    const remoteFile = basePath + relPath.replace(/\\/g, '/');
                    sftp.fastPut(localFile, remoteFile, (err) => {
                        if (err) { console.error(`❌ فشل رفع ${relPath}:`, err.message); }
                        else { console.log(`✅ ${relPath}`); }
                        uploaded++;
                        if (uploaded === filesToUpload.length) {
                            console.log('\n⏳ جاري البناء وإعادة التشغيل على N11...');
                            conn.exec(`cd ${basePath} && npm run build 2>&1 | tail -20 && pm2 restart n11 && echo "✅ BUILD_DONE"`, (err, stream) => {
                                stream.on('close', () => { console.log('🚀 اكتمل!'); conn.end(); })
                                    .on('data', d => process.stdout.write(d.toString()))
                                    .stderr.on('data', d => process.stderr.write(d.toString()));
                            });
                        }
                    });
                });
            });
        });
    });
}).connect(config);
