const { Client } = require('ssh2');
const conn = new Client();
const MASTER = '/www/wwwroot/n11.namainvist.com';
const PORT = 3500;

conn.on('ready', () => {
    const cmd = `
pm2 delete saas-app 2>/dev/null || true
echo "=== Checking .next dir ==="
ls -la ${MASTER}/.next/ 2>/dev/null | head -5 || echo ".next MISSING!"
ls -la ${MASTER}/ | grep -E ".next|package"
echo "=== Building n11 ==="
cd ${MASTER} && npm run build 2>&1 | tail -10
echo "=== Build done, starting ==="
pm2 start ${MASTER}/node_modules/next/dist/bin/next --name saas-app --cwd ${MASTER} -- start -p ${PORT}
pm2 save --force
sleep 10
echo "=== Test ==="
curl -s -o /dev/null -w "HTTP %{http_code}" http://127.0.0.1:${PORT}/ 2>/dev/null
echo ""
pm2 logs saas-app --lines 5 --nostream 2>/dev/null | grep -v "^$" | tail -8
`;
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 120000 });
