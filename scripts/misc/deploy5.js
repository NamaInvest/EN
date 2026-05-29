const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
};

const basePath = '/www/wwwroot/n11.namainvist.com/';

const filesToUpload = [
    'src/app/(dashboard)/settings/page.tsx',
    'src/app/(dashboard)/fixed-assets/page.tsx',
    'src/app/pos/page.tsx',
    'src/app/restaurant-pos/page.tsx',
    'src/app/(dashboard)/sales/page.tsx',
    'src/lib/translations.ts',
    'src/hooks/useMadaTerminal.ts',
    'src/components/PosReturnsModal.tsx'
];

console.log('🔄 جاري الرفع للسيرفر المباشر (N11)...');

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ تم الاتصال بنجاح!');
    
    // Fire and forget directory creation to instantly unlock SFTP
    conn.exec(`mkdir -p /www/wwwroot/n11.namainvist.com/src/hooks /www/wwwroot/n11.namainvist.com/src/components`, () => {});

    setTimeout(() => {
        conn.sftp((err, sftp) => {
            if (err) {
                console.error('SFTP Error:', err);
                conn.end();
                return;
            }
            
            let uploaded = 0;
            filesToUpload.forEach(relPath => {
                const localFile = path.join(__dirname, relPath);
                const remoteFile = basePath + relPath.replace(/\\/g, '/');
                
                sftp.fastPut(localFile, remoteFile, (err) => {
                    if (err) {
                        console.log(`❌ فشل رفع ملف: ${relPath}`, err.message);
                        // don't throw, just count so it doesn't hang
                    } else {
                        console.log(`✅ تم رفع ${relPath}`);
                    }
                    uploaded++;
                    
                    if (uploaded === filesToUpload.length) {
                        console.log('⏳ جاري إعادة بناء المشروع (Next.js Build) وإعادة تشغيل N11...');
                        conn.exec(`cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11`, (err, stream) => {
                            if (err) throw err;
                            stream.on('close', (code, signal) => {
                                console.log('🚀 تمت عملية البناء وإعادة التشغيل بنجاح مدوي!');
                                conn.end();
                            }).on('data', (data) => process.stdout.write(data.toString()))
                              .stderr.on('data', (data) => process.stderr.write(data.toString()));
                        });
                    }
                });
            });
        });
    }, 1500); // 1.5 seconds gives mkdir enough time without hanging handlers

}).on('error', (err) => {
    console.error('❌ خطأ في الاتصال:', err);
}).connect(config);
