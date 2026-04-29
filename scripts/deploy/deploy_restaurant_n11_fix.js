const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const APP = '/www/wwwroot/n11.namainvist.com';

const files = [
    'src/hooks/FeatureGuard.tsx',
    'src/components/PosReturnsModal.tsx',
    'src/components/InvoiceReceipt.tsx',
];

conn.on('ready', () => {
    console.log('✅ متصل - رفع الملفات المفقودة إلى N11...');

    const dirs = [...new Set(files.map(f => path.posix.dirname(f)))];
    const mkdirCmd = dirs.map(d => `mkdir -p "${APP}/${d}"`).join(' && ');

    conn.exec(mkdirCmd, (err, stream) => {
        if (err) throw err;
        stream.resume();
        stream.on('close', () => {
            conn.sftp((err, sftp) => {
                if (err) throw err;
                let done = 0;
                files.forEach(f => {
                    const localPath = path.join(__dirname, f);
                    if (!fs.existsSync(localPath)) {
                        console.log(`⚠️ ملف غير موجود محلياً: ${f} - تخطي`);
                        done++;
                        if (done === files.length) startBuild();
                        return;
                    }
                    sftp.fastPut(localPath, `${APP}/${f}`, (err) => {
                        if (err) console.log(`❌ ${f}: ${err.message}`);
                        else console.log(`📤 ${f}`);
                        done++;
                        if (done === files.length) startBuild();
                    });
                });

                function startBuild() {
                    console.log('\n⏳ إعادة بناء N11...');
                    conn.exec(`cd ${APP} && npm run build 2>&1 | tail -20 && pm2 restart saas-app && echo "✅ DONE"`, (err, stream2) => {
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
