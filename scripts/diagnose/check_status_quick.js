const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== PM2 Status ==="
pm2 list

echo ""
echo "=== Any hanging build processes? ==="
ps aux | grep -E "node|next|npm" | grep -v grep | head -10

echo ""
echo "=== Main-site logs (last 10 lines) ==="
pm2 logs main-site --lines 10 --nostream 2>/dev/null | tail -15

echo ""
echo "=== saas-app logs (last 10 lines) ==="
pm2 logs saas-app --lines 10 --nostream 2>/dev/null | tail -15
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
