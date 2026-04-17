const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = [
        'echo "=== PM2 saas-app status ==="',
        'pm2 show saas-app 2>/dev/null | grep -E "status|port|uptime|pid"',
        'echo "=== Test: Homepage ==="',
        'curl -s -o /dev/null -w "HTTP %{http_code}" -H "Host: n11.namainvist.com" http://127.0.0.1:3000/ 2>/dev/null',
        'echo ""',
        'echo "=== Test: Login page ==="',
        'curl -s -o /dev/null -w "HTTP %{http_code}" -H "Host: n11.namainvist.com" http://127.0.0.1:3000/login 2>/dev/null',
        'echo ""',
        'echo "=== Test: Check DB connection for n11 ==="',
        'curl -s -H "Host: n11.namainvist.com" http://127.0.0.1:3000/api/auth/login -X POST -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin"}\' 2>/dev/null | head -c 200',
        'echo ""',
        'echo "=== saas-app logs (last 10) ==="',
        'pm2 logs saas-app --lines 10 --nostream 2>/dev/null | tail -15',
    ].join(' && ');
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000 });
