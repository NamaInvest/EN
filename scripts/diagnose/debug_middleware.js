const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== محتوى check-status على saas-app ==="
cat /www/wwwroot/n11.namainvist.com/src/app/api/tenant/check-status/route.ts 2>/dev/null

echo ""
echo "=== اختبار API مباشرة (userId الحقيقي) ==="
curl -s "http://127.0.0.1:3500/api/tenant/check-status?userId=user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs" 2>/dev/null

echo ""
echo "=== SAAS_INTERNAL_URL في .env ==="
grep -i "SAAS_INTERNAL" /www/wwwroot/namainvist.com/.env 2>/dev/null || echo "NOT SET in main-site .env"
grep -i "SAAS_INTERNAL" /www/wwwroot/n11.namainvist.com/.env 2>/dev/null || echo "NOT SET in saas-app .env"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
