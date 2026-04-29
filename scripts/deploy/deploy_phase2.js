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

        const buildAndRestart = async (dir, name) => {
            return new Promise(res => {
                console.log(`\n🔨 Building ${name}...`);
                conn.exec(
                    `cd ${dir} && npm run build 2>&1 | tail -5 && pm2 restart ${name} && echo "✅ ${name} done"`,
                    (e, s) => {
                        s.on('data', d => process.stdout.write(d.toString()));
                        s.stderr.on('data', d => process.stderr.write(d.toString()));
                        s.on('close', res);
                    }
                );
            });
        };

        const run = async () => {
            // إنشاء المجلدات أولاً
            await mkdirCmd('/www/wwwroot/n11.namainvist.com/src/app/api/tenant/trial-status');
            await mkdirCmd('/www/wwwroot/n11.namainvist.com/src/app/pricing');
            await mkdirCmd('/www/wwwroot/namainvist.com/src/app/pricing');

            // رفع الملفات
            await upload(
                'c:/Users/1/Desktop/alfa/src/app/api/tenant/trial-status/route.ts',
                '/www/wwwroot/n11.namainvist.com/src/app/api/tenant/trial-status/route.ts',
                'trial-status API'
            );
            await upload(
                'c:/Users/1/Desktop/alfa/src/lib/quotaGuard.ts',
                '/www/wwwroot/n11.namainvist.com/src/lib/quotaGuard.ts',
                'quotaGuard lib'
            );
            await upload(
                'c:/Users/1/Desktop/alfa/src/app/api/sales/route.ts',
                '/www/wwwroot/n11.namainvist.com/src/app/api/sales/route.ts',
                'sales API (with quota)'
            );
            await upload(
                'c:/Users/1/Desktop/alfa/src/app/api/products/route.ts',
                '/www/wwwroot/n11.namainvist.com/src/app/api/products/route.ts',
                'products API (with quota)'
            );
            await upload(
                'c:/Users/1/Desktop/alfa/src/app/pricing/page.tsx',
                '/www/wwwroot/n11.namainvist.com/src/app/pricing/page.tsx',
                'pricing page (saas-app)'
            );
            await upload(
                'c:/Users/1/Desktop/alfa/src/app/pricing/page.tsx',
                '/www/wwwroot/namainvist.com/src/app/pricing/page.tsx',
                'pricing page (main-site)'
            );

            // بناء وإعادة تشغيل
            await buildAndRestart('/www/wwwroot/namainvist.com', 'main-site');
            await buildAndRestart('/www/wwwroot/n11.namainvist.com', 'saas-app');

            console.log('\n🎉 Phase 2 deployed successfully!');
            conn.end();
        };

        run().catch(e => { console.error('Deploy error:', e); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
