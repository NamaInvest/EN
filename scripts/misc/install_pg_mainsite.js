const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== pg في main-site ==="
grep -i '"pg"' /www/wwwroot/namainvist.com/package.json 2>/dev/null

echo ""
echo "=== تثبيت pg ==="
cd /www/wwwroot/namainvist.com && npm install pg @types/pg --save 2>&1 | tail -5
echo "✅ Done"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
