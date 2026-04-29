const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== Testing login API ==="
curl -v -s -X POST http://127.0.0.1:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Host: namainvest.namainvist.com" \
  -d '{"username":"admin","password":"admin"}' 2>&1 | head -40

echo ""
echo "=== Checking login route first few lines ==="
head -20 /www/wwwroot/n11.namainvist.com/src/app/api/auth/login/route.ts
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
