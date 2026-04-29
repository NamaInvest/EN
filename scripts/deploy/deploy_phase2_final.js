const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;

        const mkdirCmd = (path) => new Promise(res =>
            conn.exec(`mkdir -p "${path}"`, (e, s) => { s.on('close', res); })
        );

        const upload = (local, remote, label) => new Promise((res, rej) => {
            sftp.fastPut(local, remote, {}, err => {
                if (err) { console.error(`❌ ${label}:`, err.message); rej(err); }
                else { console.log(`✅ ${label}`); res(); }
            });
        });

        const run = async () => {
            // إنشاء المجلدات المطلوبة
            await mkdirCmd('/www/wwwroot/n11.namainvist.com/src/app/api/tenant/trial-status');
            await mkdirCmd('/www/wwwroot/n11.namainvist.com/src/app/pricing');
            await mkdirCmd('/www/wwwroot/namainvist.com/src/app/pricing');

            // رفع كل الملفات
            await upload('c:/Users/1/Desktop/alfa/src/lib/quotaGuard.ts',
                '/www/wwwroot/n11.namainvist.com/src/lib/quotaGuard.ts', '✅ quotaGuard.ts');

            await upload('c:/Users/1/Desktop/alfa/src/app/api/products/route.ts',
                '/www/wwwroot/n11.namainvist.com/src/app/api/products/route.ts', '✅ products/route.ts');

            await upload('c:/Users/1/Desktop/alfa/src/app/api/sales/route.ts',
                '/www/wwwroot/n11.namainvist.com/src/app/api/sales/route.ts', '✅ sales/route.ts');

            await upload('c:/Users/1/Desktop/alfa/src/app/api/tenant/trial-status/route.ts',
                '/www/wwwroot/n11.namainvist.com/src/app/api/tenant/trial-status/route.ts', '✅ trial-status/route.ts');

            await upload('c:/Users/1/Desktop/alfa/src/app/pricing/page.tsx',
                '/www/wwwroot/n11.namainvist.com/src/app/pricing/page.tsx', '✅ pricing/page.tsx (saas)');

            await upload('c:/Users/1/Desktop/alfa/src/app/pricing/page.tsx',
                '/www/wwwroot/namainvist.com/src/app/pricing/page.tsx', '✅ pricing/page.tsx (main)');

            // تحقق من رفع الملفات
            console.log('\n🔍 تحقق من الرفع...');
            await new Promise(res => {
                conn.exec(`
grep -c "checkQuota" /www/wwwroot/n11.namainvist.com/src/app/api/products/route.ts && echo "✅ products quotaGuard OK" || echo "❌ products quotaGuard MISSING"
grep -c "checkQuota" /www/wwwroot/n11.namainvist.com/src/app/api/sales/route.ts && echo "✅ sales quotaGuard OK" || echo "❌ sales quotaGuard MISSING"
head -2 /www/wwwroot/n11.namainvist.com/src/lib/quotaGuard.ts && echo "✅ quotaGuard.ts OK" || echo "❌ quotaGuard.ts MISSING"
head -2 /www/wwwroot/n11.namainvist.com/src/app/api/tenant/trial-status/route.ts && echo "✅ trial-status OK" || echo "❌ trial-status MISSING"
test -f /www/wwwroot/n11.namainvist.com/src/app/pricing/page.tsx && echo "✅ pricing OK" || echo "❌ pricing MISSING"
                `, (e, s) => {
                    s.on('data', d => process.stdout.write(d.toString()));
                    s.on('close', res);
                });
            });

            // بناء saas-app
            console.log('\n🔨 Building saas-app...');
            conn.exec(
                'cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -6 && pm2 restart saas-app && echo "✅ saas-app DONE"',
                (e, s) => {
                    s.on('data', d => process.stdout.write(d.toString()));
                    s.stderr.on('data', d => process.stderr.write(d.toString()));
                    s.on('close', () => {
                        // بناء main-site (لأن pricing موجود هناك)
                        console.log('\n🔨 Building main-site...');
                        conn.exec(
                            'cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -6 && pm2 restart main-site && echo "✅ main-site DONE"',
                            (e2, s2) => {
                                s2.on('data', d => process.stdout.write(d.toString()));
                                s2.stderr.on('data', d => process.stderr.write(d.toString()));
                                s2.on('close', () => { console.log('\n🎉 All deployed!'); conn.end(); });
                            }
                        );
                    });
                }
            );
        };

        run().catch(e => { console.error('Error:', e); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
