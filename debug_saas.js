const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== saas-app env ==="
pm2 env 25 2>/dev/null | grep -E "DATABASE_URL|TENANT|NODE_ENV" | head -20
echo "=== saas-app last 30 lines of logs ==="
pm2 logs 25 --lines 30 --nostream 2>/dev/null | tail -40
echo "=== Testing /api/settings on yessip ==="
curl -s -o /dev/null -w "%{http_code}" -H "Host: yessip.namainvist.com" http://127.0.0.1:3500/api/settings
echo ""
echo "=== Testing auto-login on yessip ==="
curl -s -H "Host: yessip.namainvist.com" http://127.0.0.1:3500/api/auth/auto-login?token=test | head -100
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
