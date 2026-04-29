const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', async () => {
    console.log('✅ متصل - إصلاح namasoft\n');

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
        // 1. تثبيت @clerk/nextjs المفقود
        console.log('📦 [1] تثبيت @clerk/nextjs و ssh2-sftp-client...');
        await run('cd /var/www/namasoft && npm install @clerk/nextjs @clerk/localizations ssh2-sftp-client 2>&1 | tail -5');

        // 2. حذف .next القديم وإعادة البناء
        console.log('\n🗑️  [2] حذف .next القديم...');
        await run('rm -rf /var/www/namasoft/.next');

        console.log('\n🔨 [3] إعادة البناء الكاملة...');
        await run('cd /var/www/namasoft && npm run build 2>&1 | tail -25');

        // 3. تحقق من BUILD_ID
        console.log('\n🔍 [4] التحقق من BUILD_ID...');
        const buildId = await run('cat /var/www/namasoft/.next/BUILD_ID 2>/dev/null || echo "FAILED"');

        if (buildId.includes('FAILED')) {
            console.log('❌ البناء فشل مجدداً. جرّب الاستعادة من النسخة الاحتياطية...');
            await run('rm -rf /var/www/namasoft/.next && cp -r /var/www/namasoft_backup_20260414/.next /var/www/namasoft/ 2>&1');
            console.log('✅ تم استعادة .next من النسخة الاحتياطية');
        } else {
            console.log(`✅ BUILD_ID: ${buildId.trim()}`);
        }

        // 4. إعادة تشغيل
        console.log('\n🔄 [5] إعادة تشغيل namasoft...');
        await run('pm2 restart namasoft 2>&1');
        await new Promise(r => setTimeout(r, 3000));

        // 5. تحقق نهائي
        console.log('\n═══ ✅ الحالة النهائية ═══');
        await run('pm2 list --no-color 2>&1');

    } catch (e) {
        console.error('❌ خطأ:', e.message);
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
