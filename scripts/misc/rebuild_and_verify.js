const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`

echo "=== 1. Rebuild main-site with new NEXT_PUBLIC_ env ==="
cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -8

echo ""
echo "=== 2. Restart with --update-env ==="
pm2 restart main-site --update-env

echo ""
echo "=== 3. Check mgmg_db exists ==="
psql -U n11_db -h localhost -t -c "SELECT datname FROM pg_database WHERE datname='mgmg_db';" 2>/dev/null
psql -U n11_db -h localhost -d mgmg_db -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "mgmg_db NOT FOUND"

echo ""
echo "=== 4. Verify tenant_accounts ==="
psql -U n11_db -h localhost -d n11_db -c "SELECT subdomain, clerk_user_id, status FROM tenant_accounts;" 2>/dev/null

echo ""
echo "=== 5. Test check-status from saas-app ==="
sleep 4
curl -s "http://127.0.0.1:3500/api/tenant/check-status?userId=user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs" 2>/dev/null
    `, { pty: false }, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
