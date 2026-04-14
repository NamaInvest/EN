const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', async () => {
    console.log('✅ متصل بسيرفر 204.168.144.74\n');

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
        // 1. شوف الـ PM2 الحالي
        console.log('═══ PM2 الحالي ═══');
        await run('pm2 list --no-color 2>&1');

        // 2. شوف إذا namasoft2 موجود
        console.log('\n═══ التحقق من namasoft2 ═══');
        await run('ls /var/www/namasoft2/ 2>&1 | head -20');

        // 3. شوف package.json لمعرفة الأمر الصحيح
        console.log('\n═══ package.json لـ namasoft ═══');
        await run('cat /var/www/namasoft/package.json 2>&1 | grep -E "scripts|start|dev" | head -10');

        // 4. شوف .env لمعرفة البورت
        console.log('\n═══ PORT في .env لـ namasoft2 ═══');
        await run('grep -E "PORT|port" /var/www/namasoft2/.env 2>/dev/null | head -5 || echo "لا يوجد .env"');

        // 5. شوف pm2 ecosystem إن وجد
        console.log('\n═══ ecosystem.config ═══');
        await run('cat /var/www/namasoft2/ecosystem.config.js 2>/dev/null || cat /var/www/namasoft2/ecosystem.config.cjs 2>/dev/null || echo "لا يوجد ecosystem"');

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
    readyTimeout: 20000,
});
