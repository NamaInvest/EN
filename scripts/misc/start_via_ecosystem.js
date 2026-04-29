const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
# Use ecosystem config for proper port configuration
pm2 delete 28 2>/dev/null || true
sleep 1
cd /www/wwwroot/n11.namainvist.com && pm2 start ecosystem.config.js
sleep 3
pm2 list

echo ""
echo "=== Final verification ==="
# Test settings API on port 3500
TOKEN=$(curl -s -X POST http://127.0.0.1:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Host: namainvest.namainvist.com" \
  -d '{"username":"admin","password":"admin"}' 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token','NO_TOKEN'))" 2>/dev/null)

echo "Token received: \${#TOKEN} chars"

COUNT=$(curl -s http://127.0.0.1:3500/api/settings \
  -H "Host: namainvest.namainvist.com" \
  -H "Authorization: Bearer \$TOKEN" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Settings count: {len(d) if isinstance(d,list) else d}')" 2>/dev/null)
echo "\$COUNT"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
