const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== Test check-status on port 3000 (main-site) ==="
curl -s "http://127.0.0.1:3000/api/tenant/check-status?userId=user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs" 2>/dev/null

echo ""
echo "=== Test check-status on port 3500 (saas-app) ==="
curl -s "http://127.0.0.1:3500/api/tenant/check-status?userId=user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs" 2>/dev/null

echo ""
echo "=== Check main-site path ==="
ls /www/wwwroot/namainvist.com/src/app/api/tenant/check-status/ 2>/dev/null || echo "No check-status in main-site"

echo ""
echo "=== Current tenant_accounts ==="
psql -U n11_db -h localhost -d n11_db -c "SELECT subdomain, user_email, clerk_user_id, status FROM tenant_accounts;" 2>/dev/null
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
