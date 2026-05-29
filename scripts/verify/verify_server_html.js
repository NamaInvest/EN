const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
cd /www/wwwroot/n3.namainvist.com
echo "=== Dashboard Page HTML ==="
cat .next/server/app/\\(dashboard\\)/dashboard/page.html 2>/dev/null || echo "No dashboard HTML"
echo "=== Search in server pages ==="
grep -r "dashboard.title" .next/server/app/ 2>/dev/null | head -5
echo "=== Search Arabic in server pages ==="
grep -r "لوحة التحكم" .next/server/app/ 2>/dev/null | head -5
`;

    conn.exec(cmd, (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => { console.log(out); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
