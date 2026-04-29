const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- CHECKING SERVER APP DIRECTORY ---');
    const bashScript = `
echo "=== PM2 INFO ==="
pm2 jlist | grep -o '"name":"nama-main"[^}]*"pm_cwd":"[^"]*"' | head -n 1
echo "=== PAGE CONTENT CHECK ==="
grep -A 2 -B 2 "الربع الأول" /www/wwwroot/namainvist.com/src/app/page.tsx || echo "TEXT NOT FOUND IN FILE"
echo "=== NEXT.JS BUILD TIME ==="
ls -la /www/wwwroot/namainvist.com/.next/server/app/صفحة* || echo "No pages"
    `;
    conn.exec(bashScript, (err, stream) => {
        if(err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            conn.end();
            console.log('--- DEBUG DONE ---');
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
