const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
pm2 logs saas-app --lines 30 --nostream 2>&1

echo ""
echo "=== saas-app env ==="
pm2 env 25 2>&1 | grep -E "PORT|HOST|NODE_ENV" | head -10
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
