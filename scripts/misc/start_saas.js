const { Client } = require('ssh2');
const conn = new Client();
const MASTER = '/www/wwwroot/n11.namainvist.com';

conn.on('ready', () => {
    const cmd = `
pm2 delete saas-app 2>/dev/null || true
cd ${MASTER}
pm2 start ecosystem.config.js
pm2 save --force
sleep 10
echo "=== PM2 ==="
pm2 list | grep -E "saas|main|ice"
echo "=== Test port 3500 ==="
curl -s -o /dev/null -w "HTTP %{http_code}\\n" http://127.0.0.1:3500/ 2>/dev/null
echo "=== Test with Host: n11 ==="
curl -s -o /dev/null -w "HTTP %{http_code}\\n" -H "Host: n11.namainvist.com" http://127.0.0.1:3500/api/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin"}' 2>/dev/null
echo "=== Logs ==="
pm2 logs saas-app --lines 8 --nostream 2>/dev/null | grep -v "^\\[TAIL" | tail -10
`;
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
