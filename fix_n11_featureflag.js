const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const APP = '/www/wwwroot/n11.namainvist.com';

conn.on('ready', () => {
    console.log('✅ متصل...');

    // 1. Fix: delete duplicate saas-app (id 30) and upload missing file
    conn.sftp((err, sftp) => {
        if (err) throw err;

        const localFile = path.join(__dirname, 'src/hooks/useFeatureFlag.tsx');
        sftp.fastPut(localFile, `${APP}/src/hooks/useFeatureFlag.tsx`, (err) => {
            if (err) console.log('❌ خطأ:', err.message);
            else console.log('📤 src/hooks/useFeatureFlag.tsx');

            console.log('\n⏳ تنظيف PM2 وإعادة البناء...');
            const cmd = [
                `pm2 delete 30 2>/dev/null`,
                `cd ${APP}`,
                `npm run build 2>&1 | tail -20`,
                `pm2 restart saas-app`,
                `echo "✅ DONE"`
            ].join(' && ');

            conn.exec(cmd, (err, stream) => {
                if (err) throw err;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => conn.end());
            });
        });
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000
});
