const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== PM2 logs for main-site (last 20 lines) ==="
pm2 logs main-site --lines 20 --nostream 2>/dev/null

echo ""
echo "=== Direct test with verbose ==="
curl -v "http://127.0.0.1:3000/api/tenant/check-status?userId=user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs" 2>&1 | tail -5
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
