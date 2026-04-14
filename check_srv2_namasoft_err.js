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
        // شوف الخطأ الجديد في namasoft
        console.log('═══ خطأ namasoft الحالي ═══');
        await run('pm2 logs namasoft --lines 15 --nostream --err 2>&1');

        // شوف البناء هل له BUILD_ID
        console.log('\n═══ BUILD_ID ═══');
        await run('cat /var/www/namasoft/.next/BUILD_ID 2>/dev/null || echo "لا يوجد BUILD_ID"');

        // شوف package.json start script
        console.log('\n═══ start command ═══');
        await run('pm2 describe namasoft 2>&1 | grep -E "script|exec|cwd|pm_exec"');

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
