const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', async () => {
    console.log('✅ متصل بسيرفر 204\n');

    const run = (cmd, silent = false) => new Promise((resolve, reject) => {
        conn.exec(cmd, (err, stream) => {
            if (err) return reject(err);
            let out = '';
            stream.on('data', d => { if (!silent) process.stdout.write(d); out += d; });
            stream.stderr.on('data', d => { if (!silent) process.stdout.write(d); });
            stream.on('close', () => resolve(out));
        });
    });

    try {
        // ══ namasoft: npm install + build + restart ══════
        console.log('═══════════════════════════════════════════');
        console.log('🔧 [1/4] تثبيت dependencies لـ namasoft...');
        console.log('═══════════════════════════════════════════');
        await run('cd /var/www/namasoft && npm install --legacy-peer-deps 2>&1 | tail -10');

        console.log('\n🔨 [2/4] بناء namasoft...');
        await run('cd /var/www/namasoft && npm run build 2>&1 | tail -20');

        console.log('\n🔄 [3/4] إعادة تشغيل namasoft...');
        await run('pm2 restart namasoft 2>&1');
        await run('pm2 save 2>&1', true);

        // ══ namasoft2: تسجيل + build + start ════════════
        console.log('\n═══════════════════════════════════════════');
        console.log('🔧 [2/4] تثبيت dependencies لـ namasoft2...');
        console.log('═══════════════════════════════════════════');
        await run('cd /var/www/namasoft2 && npm install --legacy-peer-deps 2>&1 | tail -10');

        console.log('\n🔨 بناء namasoft2...');
        await run('cd /var/www/namasoft2 && npm run build 2>&1 | tail -20');

        console.log('\n🚀 [4/4] تسجيل namasoft2 في PM2 وتشغيله على port 3001...');
        // أوقف القديم إن وجد
        await run('pm2 delete namasoft2 2>/dev/null || true', true);
        // شغّل على port 3001
        await run('cd /var/www/namasoft2 && PORT=3001 pm2 start npm --name namasoft2 -- start 2>&1');
        await run('pm2 save 2>&1');

        console.log('\n═══ ✅ حالة PM2 النهائية ═══');
        await run('pm2 list --no-color 2>&1');

        console.log('\n╔═════════════════════════════════════════╗');
        console.log('║  🎉 سيرفر 204 يعمل بالكامل!            ║');
        console.log('║  ✅ namasoft  → port 3000               ║');
        console.log('║  ✅ namasoft2 → port 3001               ║');
        console.log('╚═════════════════════════════════════════╝');

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
