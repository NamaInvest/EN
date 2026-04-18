const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== Testing /api/auth/login on saas-app ==="
curl -s -X POST http://127.0.0.1:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Host: yessip.namainvist.com" \
  -d '{"username":"admin","password":"admin"}' | head -200
echo ""
echo "=== Files in saas-app api/auth ==="
ls /www/wwwroot/n11.namainvist.com/.next/server/app/api/auth/ 2>/dev/null || echo "Not found"
ls /www/wwwroot/n11.namainvist.com/src/app/api/auth/ 2>/dev/null || echo "No src dir"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
