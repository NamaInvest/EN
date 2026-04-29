const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const APP = '/www/wwwroot/n11.namainvist.com';

// All files the restaurant-pos page depends on
const files = [
    'src/hooks/useFeatureFlag.ts',
    'src/hooks/FeatureGuard.tsx',
    'src/components/PosReturnsModal.tsx',
    'src/components/InvoiceReceipt.tsx',
    'src/app/restaurant-pos/page.tsx',
    'src/app/api/pos/restaurant/floor/route.ts',
];

conn.on('ready', () => {
    console.log('✅ متصل - رفع جميع ملفات خريطة المطعم إلى N11...');

    const dirs = [...new Set(files.map(f => path.posix.dirname(f)))];
    const mkdirCmd = dirs.map(d => `mkdir -p "${APP}/${d}"`).join(' && ');

    conn.exec(mkdirCmd, (err, stream) => {
        if (err) throw err;
        stream.resume();
        stream.on('close', () => {
            conn.sftp((err, sftp) => {
                if (err) throw err;
                let done = 0;
                let uploaded = 0;
                files.forEach(f => {
                    const localPath = path.join(__dirname, f);
                    if (!fs.existsSync(localPath)) {
                        console.log(`⚠️ غير موجود محلياً: ${f}`);
                        done++;
                        if (done === files.length) startBuild();
                        return;
                    }
                    sftp.fastPut(localPath, `${APP}/${f}`, (err) => {
                        if (err) console.log(`❌ ${f}: ${err.message}`);
                        else { console.log(`📤 ${f}`); uploaded++; }
                        done++;
                        if (done === files.length) startBuild();
                    });
                });

                function startBuild() {
                    console.log(`\n✅ تم رفع ${uploaded} ملف. ⏳ إعادة البناء...`);
                    conn.exec(`cd ${APP} && npm run build 2>&1 | tail -25 && pm2 restart saas-app 2>/dev/null; pm2 start npm --name saas-app -- start -- -p 3500 2>/dev/null; echo "✅ DONE"`, (err, stream2) => {
                        stream2.on('data', d => process.stdout.write(d.toString()));
                        stream2.stderr.on('data', d => process.stderr.write(d.toString()));
                        stream2.on('close', () => conn.end());
                    });
                }
            });
        });
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000
});
