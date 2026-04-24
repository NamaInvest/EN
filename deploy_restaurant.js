const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const APP = '/www/wwwroot/namainvist.com';

const files = [
    'src/app/restaurant-pos/page.tsx',
    'src/app/api/pos/restaurant/floor/route.ts',
];

conn.on('ready', () => {
    console.log('✅ متصل - رفع ملفات خريطة المطعم...');

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
                        console.log(`⚠️ ملف غير موجود محلياً: ${f}`);
                        done++;
                        return;
                    }
                    sftp.fastPut(localPath, `${APP}/${f}`, (err) => {
                        if (err) console.log(`❌ ${f}: ${err.message}`);
                        else console.log(`📤 ${f}`);
                        done++;
                        if (done === files.length) {
                            console.log('\n⏳ إعادة بناء الموقع...');
                            conn.exec(`cd ${APP} && npx prisma generate && npm run build 2>&1 | tail -15 && pm2 restart main-site && echo "✅ DONE"`, (err, stream2) => {
                                stream2.on('data', d => process.stdout.write(d.toString()));
                                stream2.stderr.on('data', d => process.stderr.write(d.toString()));
                                stream2.on('close', () => conn.end());
                            });
                        }
                    });
                });
            });
        });
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000
});
