const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== Testing auto-login for yashish ==="
# توليد SSO token اختباري
node -e "
const { createHmac } = require('crypto');
const SSO_SECRET = 'namainvest-sso-2024';
const payload = Buffer.from(JSON.stringify({
    type: 'sso-auto-login',
    exp: Date.now() + 300000,
    subdomain: 'yashish'
})).toString('base64url');
const sig = createHmac('sha256', SSO_SECRET).update(payload).digest('hex');
console.log(payload + ':' + sig);
" > /tmp/test_token.txt
TOKEN=$(cat /tmp/test_token.txt)
echo "Token: $TOKEN"

echo ""
echo "=== Testing auto-login API ==="
curl -s -H "Host: yashish.namainvist.com" "http://127.0.0.1:3500/api/auth/auto-login?token=$TOKEN"

echo ""
echo "=== Testing login with ialqrashi62 ==="
curl -s -X POST http://127.0.0.1:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Host: yashish.namainvist.com" \
  -d '{"username":"ialqrashi62","password":"admin"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('SUCCESS token:', d.get('token','')[:30] if d.get('token') else 'FAIL: ' + str(d))"

echo ""
echo "=== Testing login with admin ==="
curl -s -X POST http://127.0.0.1:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Host: yashish.namainvist.com" \
  -d '{"username":"admin","password":"admin"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print('SUCCESS token:', d.get('token','')[:30] if d.get('token') else 'FAIL: ' + str(d))"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
