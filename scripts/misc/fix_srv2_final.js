const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', async () => {
    console.log('✅ متصل - إصلاح نهائي لـ namasoft\n');

    const run = (cmd) => new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let out = '';
            stream.on('data', d => { process.stdout.write(d); out += d; });
            stream.stderr.on('data', d => process.stdout.write(d));
            stream.on('close', () => resolve(out));
        });
    });

    try {
        console.log('📦 [1] تثبيت كل المكتبات المفقودة...');
        await run(`cd /var/www/namasoft && npm install 2>&1 | tail -5`);

        console.log('\n🔍 [2] ما هي المكتبات المفقودة تحديداً؟');
        const missing = await run(`cd /var/www/namasoft && node -e "require('@clerk/nextjs')" 2>&1 || true`);
        
        console.log('\n📦 [3] تثبيت @clerk/nextjs بإصدار محدد...');
        await run(`cd /var/www/namasoft && npm install @clerk/nextjs@5 @clerk/localizations@3 --legacy-peer-deps 2>&1 | tail -5`);

        console.log('\n🗑️  [4] حذف .next...');
        await run('rm -rf /var/www/namasoft/.next');

        console.log('\n🔨 [5] بناء جديد...');
        await run('cd /var/www/namasoft && npm run build 2>&1 | tail -30');

        const buildId = await run('cat /var/www/namasoft/.next/BUILD_ID 2>/dev/null || echo "FAILED"');
        console.log(`\nBUILD_ID: ${buildId.trim()}`);

        if (buildId.trim() === 'FAILED') {
            // آخر محاولة: استعادة .next من namasoft2 الذي يعمل
            console.log('\n🔄 استعادة .next من namasoft2 (يعمل)...');
            await run('rm -rf /var/www/namasoft/.next && cp -r /var/www/namasoft2/.next /var/www/namasoft/.next');
            console.log('✅ تم النسخ من namasoft2');
        }

        console.log('\n🔄 [6] إعادة تشغيل namasoft...');
        await run('pm2 restart namasoft 2>&1');
        await new Promise(r => setTimeout(r, 3000));

        console.log('\n═══ الحالة النهائية ═══');
        await run('pm2 list --no-color 2>&1');

    } catch (e) {
        console.error('❌', e.message);
    } finally {
        conn.end();
    }
}).connect({
    host: '204.168.144.74',
    port: 22,
    username: 'root',
    privateKey: fs.readFileSync('C:\\Users\\1\\Desktop\\namasoftkey\\namasoft_key'),
    readyTimeout: 30000,
});
