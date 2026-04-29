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
    'src/app/api/zatca/qr/route.ts',
    'src/app/api/zatca/route.ts',
    'src/lib/zatca-java.ts'
];

console.log('🔄 جاري الاتصال بخادم N11 لرفع تعديلات زاتكا Phase 2...');

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ تم الاتصال بنجاح!');
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        let uploaded = 0;
        filesToUpload.forEach(relPath => {
            const localFile = path.join(__dirname, relPath);
            const remoteFile = basePath + relPath.replace(/\\/g, '/');
            
            sftp.fastPut(localFile, remoteFile, (err) => {
                if (err) throw err;
                console.log(`✅ تم رفع: ${relPath}`);
                uploaded++;
                
                if (uploaded === filesToUpload.length) {
                    console.log('⏳ جاري إعادة بناء النظام وتطبيق التعديلات على N11...');
                    conn.exec(`cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11`, (err, stream) => {
                        if (err) throw err;
                        stream.on('close', (code, signal) => {
                            console.log('🚀 تمت عملية التحديث بنجاح! ZATCA Phase 2 نشط الآن.');
                            conn.end();
                        }).on('data', (data) => process.stdout.write(data.toString()))
                          .stderr.on('data', (data) => process.stderr.write(data.toString()));
                    });
                }
            });
        });
    });
}).on('error', (err) => {
    console.error('❌ خطأ في الاتصال:', err);
}).connect(config);
