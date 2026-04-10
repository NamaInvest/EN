const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

const basePath = '/www/wwwroot/n11.namainvist.com/';

const filesToUpload = [
    'src/locales/ar.json',
    'src/locales/en.json',
    'src/app/api/sales/route.ts',
    'src/app/(dashboard)/sales/page.tsx'
];

console.log('🔄 جاري الاتصال بخادم N11 الحقيقي (46.4.188.170)...');

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ تم الاتصال بنجاح!');
    
    conn.exec(`mkdir -p /www/wwwroot/n11.namainvist.com/src/locales && mkdir -p /www/wwwroot/n11.namainvist.com/src/app/api/sales && mkdir -p /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/sales`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            
            conn.sftp((err, sftp) => {
                if (err) throw err;
                
                let uploaded = 0;
                filesToUpload.forEach(relPath => {
                    const localFile = path.join(__dirname, relPath);
                    const remoteFile = basePath + relPath.replace(/\\/g, '/');
                    
                    sftp.fastPut(localFile, remoteFile, (err) => {
                        if (err) throw err;
                        console.log(`✅ تم رفع ${relPath}`);
                        uploaded++;
                        
                        if (uploaded === filesToUpload.length) {
                            console.log('⏳ جاري تحديث قاعدة البيانات (Prisma) وبناء المشروع وإعادة التشغيل...');
                            conn.exec(`cd /www/wwwroot/n11.namainvist.com && npx prisma db push && npx prisma generate && echo "Building Next.js..." && npm run build && echo "Restarting PM2..." && pm2 restart n11`, (err, stream) => {
                                if (err) throw err;
                                stream.on('close', (code, signal) => {
                                    console.log('🚀 تمت عملية التحديث والبناء بنجاح مدوي على N11!');
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
}).on('error', (err) => {
    console.error('❌ خطأ في الاتصال بالخادم:', err);
}).connect(config);
