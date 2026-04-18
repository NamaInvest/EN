const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== Check saas-app ecosystem config ==="
cat /www/wwwroot/n11.namainvist.com/ecosystem.config.js 2>/dev/null || echo "No ecosystem.config.js"

echo ""
echo "=== Checking .next build exists ==="
ls /www/wwwroot/n11.namainvist.com/.next/ 2>/dev/null | head -5 || echo "NO .next DIR"

echo ""
echo "=== PM2 delete old saas-app and start fresh ==="
pm2 delete saas-app 2>/dev/null || true
pm2 delete 27 2>/dev/null || true
sleep 2

cd /www/wwwroot/n11.namainvist.com && pm2 start npm --name saas-app -- start -- -p 3500
sleep 3
pm2 list
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
