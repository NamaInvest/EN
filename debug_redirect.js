const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== middleware.ts على main-site ==="
grep -n "company-info\|provisioned\|check-status\|SAAS_INTERNAL\|auto-login" /www/wwwroot/namainvist.com/src/middleware.ts 2>/dev/null

echo ""
echo "=== AFTER_SIGN_IN_URL في .env ==="
grep -i "CLERK_AFTER\|AFTER_SIGN" /www/wwwroot/namainvist.com/.env 2>/dev/null

echo ""
echo "=== هل SAAS_INTERNAL_URL موجود في أي .env؟ ==="
grep -r "SAAS_INTERNAL" /www/wwwroot/namainvist.com/ 2>/dev/null | grep -v ".next" | head -5

echo ""
echo "=== اختبار اتصال main-site بـ saas-app ==="
curl -s --max-time 3 "http://127.0.0.1:3500/api/tenant/check-status?userId=user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
