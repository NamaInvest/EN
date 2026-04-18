// نشر سريع — يرفع الملفات ويعيد تشغيل PM2 فقط بدون npm build
// مناسب للتغييرات الصغيرة (JS/TS files only, no new dependencies)
const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const upload = (local, remote, label) => new Promise((res, rej) => {
            sftp.fastPut(local, remote, {}, err => {
                if (err) { console.error(`❌ ${label}:`, err.message); rej(err); }
                else { console.log(`✅ ${label}`); res(); }
            });
        });
        const run = async () => {
            // رفع الملفات المُصلَّحة فقط
            await upload(
                'd:/namasoft9-3-main/src/app/api/products/route.ts',
                '/www/wwwroot/n11.namainvist.com/src/app/api/products/route.ts',
                'products API'
            );
            // بناء saas-app فقط (main-site لم يتغير)
            console.log('\n🔨 Building saas-app only...');
            conn.exec(
                'cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -6 && pm2 restart saas-app && echo "✅ DONE"',
                (e, s) => {
                    s.on('data', d => process.stdout.write(d.toString()));
                    s.stderr.on('data', d => process.stderr.write(d.toString()));
                    s.on('close', () => conn.end());
                }
            );
        };
        run();
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
