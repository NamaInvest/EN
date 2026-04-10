const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 60000,
    keepaliveInterval: 10000
};

const basePath = '/www/wwwroot/n11.namainvist.com/';

const filesToUpload = [
    'src/locales/ar.json',
    'src/locales/en.json',
    'src/app/api/sales/route.ts',
    'src/app/(dashboard)/sales/page.tsx',
    'src/app/(dashboard)/reports/page.tsx'
];

console.log('🔄 جاري الاتصال بخادم N11 الحقيقي (46.4.188.170)...');

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ تم الاتصال بنجاح بـ N11!');
    
    // First, create all required directories
    console.log('🔄 جاري التحقق من المجلدات...');
    conn.exec(`mkdir -p /www/wwwroot/n11.namainvist.com/src/locales && mkdir -p /www/wwwroot/n11.namainvist.com/src/app/api/sales && mkdir -p "/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/sales" && mkdir -p "/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/reports"`, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code) => {
            console.log('✅ تم التحقق من إنشاء المجلدات.');
            
            conn.sftp((err, sftp) => {
                if (err) throw err;
                
                let uploaded = 0;
                let failed = false;

                filesToUpload.forEach(relPath => {
                    if (failed) return;
                    
                    const localFile = path.join(__dirname, relPath);
                    const remoteFile = basePath + relPath.replace(/\\/g, '/');
                    console.log('>> رفع:', localFile, '->', remoteFile);
                    
                    sftp.fastPut(localFile, remoteFile, (err) => {
                        if (err) {
                            console.error(`❌ خطأ في رفع ${relPath}`, err);
                            failed = true;
                            conn.end();
                            return;
                        }
                        console.log(`✅ تم رفع ${relPath}`);
                        uploaded++;
                        
                        if (uploaded === filesToUpload.length) {
                            console.log('⏳ جميع الملفات المرفوعة! جاري البناء الصامت (npm run build)... يرجى الانتظار قد يستغرق دقيقتين.');
                            
                            // Instead of long chaining, let's just run build and pm2 restart
                            const buildCmd = `cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11`;
                            conn.exec(buildCmd, (err, stream) => {
                                if (err) {
                                    console.error('Execution error', err);
                                    conn.end();
                                    return;
                                }
                                stream.on('close', (code, signal) => {
                                    console.log('🚀 تمت عملية التحديث والبناء بنجاح!');
                                    conn.end();
                                }).on('data', (data) => process.stdout.write(data.toString()))
                                  .stderr.on('data', (data) => process.stderr.write(data.toString()));
                            });
                        }
                    });
                });
            });
            
        }).on('data', d => console.log(d.toString())).stderr.on('data', d => console.log(d.toString()));
    });
}).on('error', (err) => {
    console.error('❌ خطأ في الاتصال بالخادم:', err);
}).connect(config);
