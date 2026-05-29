const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== Testing: what tenant does the settings API see? ==="
TOKEN=$(curl -s -X POST http://127.0.0.1:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Host: namainvest.namainvist.com" \
  -d '{"username":"admin","password":"admin"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)

echo "--- x-tenant header check ---"
curl -sv http://127.0.0.1:3500/api/settings \
  -H "Host: namainvest.namainvist.com" \
  -H "Authorization: Bearer $TOKEN" \
  2>&1 | grep -E "x-tenant|< HTTP|settings"

echo ""
echo "--- what does middleware set? ---"
# Check nginx config for namainvest subdomain
grep -r "namainvest\|x-tenant\|3500" /www/server/panel/vhost/nginx/tenants-wildcard.namainvist.com.conf 2>/dev/null | head -15
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
