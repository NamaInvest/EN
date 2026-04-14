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
        // 1. شوف لماذا namasoft errored
        console.log('═══ [1] سبب خطأ namasoft ═══');
        await run('pm2 logs namasoft --lines 30 --nostream 2>&1');

        // 2. شوف .env كامل لـ namasoft
        console.log('\n═══ [2] .env لـ namasoft ═══');
        await run('cat /var/www/namasoft/.env 2>/dev/null || echo "لا يوجد .env"');

        // 3. شوف .env لـ namasoft2
        console.log('\n═══ [3] .env لـ namasoft2 ═══');
        await run('cat /var/www/namasoft2/.env 2>/dev/null || echo "لا يوجد .env"');

        // 4. شوف إذا .next موجود
        console.log('\n═══ [4] هل .next موجود؟ ═══');
        await run('ls -la /var/www/namasoft/.next 2>/dev/null | head -5 || echo "لا يوجد .next"');
        await run('ls -la /var/www/namasoft2/.next 2>/dev/null | head -5 || echo "لا يوجد .next"');

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
