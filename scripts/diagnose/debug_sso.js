const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== Test: هل auto-login يعمل فعلاً على yessip؟ ==="
# اختبار الـ SSO flow الحقيقي
node -e "
const { createHmac } = require('crypto');
const SSO_SECRET = process.env.SSO_SECRET || 'namainvest-sso-2024';
const payload = Buffer.from(JSON.stringify({
    type: 'sso-auto-login',
    exp: Date.now() + 300000,
})).toString('base64url');
const sig = createHmac('sha256', SSO_SECRET).update(payload).digest('hex');
console.log(payload + ':' + sig);
" > /tmp/sso.txt
TOKEN=\$(cat /tmp/sso.txt)

RESULT=\$(curl -s -H "Host: yessip.namainvist.com" "http://127.0.0.1:3500/api/auth/auto-login?token=\$TOKEN")
echo "auto-login result: \$RESULT"

echo ""
echo "=== What SSO_SECRET is set on saas-app? ==="
pm2 env 25 | grep -i "SSO\|JWT\|SECRET" | head -10

echo ""
echo "=== Does the provision route generate SSO token with same secret? ==="
grep -r "SSO_SECRET\|sso-2024\|sso_secret" /www/wwwroot/n11.namainvist.com/src/app/api/tenant/provision/ 2>/dev/null | head -5
grep -r "SSO_SECRET\|sso-2024\|sso_secret" /www/wwwroot/n11.namainvist.com/src/app/api/auth/auto-login/ 2>/dev/null | head -5
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
