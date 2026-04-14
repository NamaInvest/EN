const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', async () => {
    console.log('✅ متصل\n');

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
        // شوف خطأ namasoft2
        console.log('═══ خطأ namasoft2 ═══');
        await run('pm2 logs namasoft2 --lines 10 --nostream --err 2>&1');

        // هل النسخة الاحتياطية لها .next؟
        console.log('\n═══ .next في النسخة الاحتياطية لـ namasoft2 ═══');
        await run('ls /var/www/namasoft2_backup_20260414/.next 2>/dev/null | head -10 || echo "لا يوجد"');

        // هل namasoft2 له .next؟
        console.log('\n═══ .next في namasoft2 الحالي ═══');
        await run('cat /var/www/namasoft2/.next/BUILD_ID 2>/dev/null || echo "لا يوجد BUILD_ID"');

        // استعادة .next من backup إذا موجود
        console.log('\n🔄 استعادة .next من النسخة الاحتياطية...');
        await run(`
            if [ -d /var/www/namasoft2_backup_20260414/.next ]; then
                rm -rf /var/www/namasoft2/.next
                cp -r /var/www/namasoft2_backup_20260414/.next /var/www/namasoft2/.next
                echo "✅ تم استعادة .next من النسخة الاحتياطية"
            else
                echo "❌ النسخة الاحتياطية ليس فيها .next - ننسخ من namasoft"
                rm -rf /var/www/namasoft2/.next
                cp -r /var/www/namasoft/.next /var/www/namasoft2/.next
                echo "✅ تم نسخ .next من namasoft"
            fi
        `);

        // إعادة تشغيل namasoft2
        console.log('\n🔄 إعادة تشغيل namasoft2...');
        await run('pm2 restart namasoft2 2>&1');
        await new Promise(r => setTimeout(r, 3000));

        // الحالة النهائية
        console.log('\n═══ ✅ الحالة النهائية ═══');
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
    readyTimeout: 20000,
});
