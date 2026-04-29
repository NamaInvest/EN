const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
    host: '185.197.195.202', // N11 Server
    port: 22,
    username: 'root',
    privateKey: fs.readFileSync('C:\\Users\\1\\.ssh\\id_ed25519_deploy'),
    readyTimeout: 30000
};

const basePath = '/www/wwwroot/n11.namainvist.com/';

const filesToUpload = [
    'prisma/schema.prisma',
    'src/app/api/purchases/route.ts',
    'src/app/(dashboard)/purchases/page.tsx',
    'src/app/(dashboard)/purchases/options/page.tsx',
    'src/app/(dashboard)/reports/manual-purchases/page.tsx',
    'src/components/Sidebar.tsx'
];

console.log('🔄 جاري الاتصال بالخادم لرفع التعديلات (باستخدام المفتاح الخاص)...');

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ تم الاتصال بنجاح!');
    
    // Create necessary directories first just in case to avoid 'No such file' SFTP errors
    conn.exec(`mkdir -p /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/purchases/options && mkdir -p /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/reports/manual-purchases`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            
            conn.sftp((err, sftp) => {
                if (err) throw err;
                
                let uploaded = 0;
                filesToUpload.forEach(relPath => {
                    const localFile = path.join(__dirname, relPath);
                    const remoteFile = basePath + relPath.replace(/\\/g, '/'); // ensure unix paths
                    
                    sftp.fastPut(localFile, remoteFile, (err) => {
                        if (err) throw err;
                        console.log(`✅ تم رفع ${relPath}`);
                        uploaded++;
                        
                        if (uploaded === filesToUpload.length) {
                            console.log('⏳ جاري تحديث قاعدة البيانات (Prisma) وبناء المشروع وإعادة التشغيل...');
                            conn.exec(`cd /www/wwwroot/n11.namainvist.com && npx prisma db push && npx prisma generate && echo "Building Next.js..." && npm run build && echo "Restarting PM2..." && pm2 restart n11`, (err, stream) => {
                                if (err) throw err;
                                stream.on('close', (code, signal) => {
                                    console.log('🚀 تمت عملية التحديث والبناء بنجاح مدوي!');
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
