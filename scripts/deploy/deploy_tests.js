const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const APP = '/www/wwwroot/namainvist.com';

conn.on('ready', () => {
    console.log('✅ متصل بالخادم الرئيسي (Nama Invest)...');

    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        console.log('📤 جاري رفع الملفات المحدثة...');
        sftp.fastPut(path.join(__dirname, 'upload_tests.zip'), `${APP}/upload_tests.zip`, (err) => {
            if (err) {
                console.error('❌ خطأ في الرفع:', err.message);
                conn.end();
                return;
            }
            
            console.log('✅ تم الرفع بنجاح! جاري فك الضغط وتشغيل الاختبارات على الخادم...');
            
            const commands = [
                `cd ${APP}`,
                `unzip -o upload_tests.zip`,
                `rm upload_tests.zip`,
                `npx jest src/lib/zatca.test.ts src/lib/validations.test.ts src/lib/quotaGuard.test.ts src/lib/usePagePermission.test.ts src/lib/money.test.ts src/lib/auto-journal.test.ts src/lib/bnpl.test.ts src/utils/financial.test.ts`
            ].join(' && ');

            conn.exec(commands, (err, stream) => {
                if (err) throw err;
                
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                
                stream.on('close', (code) => {
                    console.log(`\n✅ انتهت الاختبارات بكود: ${code}`);
                    console.log('⏳ جاري إعادة تشغيل الموقع...');
                    
                    conn.exec(`cd ${APP} && pm2 restart main-site && echo "🚀 الموقع يعمل الآن بالتحديثات الجديدة!"`, (err, stream2) => {
                        stream2.on('data', d => process.stdout.write(d.toString()));
                        stream2.stderr.on('data', d => process.stderr.write(d.toString()));
                        stream2.on('close', () => conn.end());
                    });
                });
            });
        });
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000
});
