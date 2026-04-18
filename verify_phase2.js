const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = [
        'echo "=== 1. DB: tenant_accounts columns ==="',
        "PGPASSWORD=n11_pass123 psql -U n11_db -h localhost -d n11_db -c \"SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name='tenant_accounts' ORDER BY ordinal_position;\" 2>&1",
        'echo ""',
        'echo "=== 2. mgmg tenant data ==="',
        "PGPASSWORD=n11_pass123 psql -U n11_db -h localhost -d n11_db -c \"SELECT subdomain,subscription_status,plan,invoice_quota,product_quota,user_quota,trial_ends_at::date FROM tenant_accounts;\" 2>&1",
        'echo ""',
        'echo "=== 3. quotaGuard.ts ==="',
        'grep -n "user.*resource\\|resource.*user\\|checkQuota" /www/wwwroot/n11.namainvist.com/src/lib/quotaGuard.ts | head -8',
        'echo ""',
        'echo "=== 4. Sales API ==="',
        "grep -n 'checkQuota\\|quotaGuard' /www/wwwroot/n11.namainvist.com/src/app/api/sales/route.ts | head -5",
        'echo ""',
        'echo "=== 5. Products API ==="',
        "grep -n 'checkQuota\\|quotaGuard' /www/wwwroot/n11.namainvist.com/src/app/api/products/route.ts | head -5",
        'echo ""',
        'echo "=== 6. TrialBanner ==="',
        'ls /www/wwwroot/n11.namainvist.com/src/components/TrialBanner* 2>/dev/null || echo "NOT FOUND"',
        'echo "=== 7. QuotaModal ==="',
        'ls /www/wwwroot/n11.namainvist.com/src/components/QuotaModal* 2>/dev/null || echo "NOT FOUND"',
        'echo "=== 8. Pricing page main-site ==="',
        'ls /www/wwwroot/namainvist.com/src/app/pricing/page.tsx 2>/dev/null && echo "OK" || echo "NOT FOUND"',
        'echo "=== 9. ICE page ==="',
        'ls /www/wwwroot/namainvist.com/src/app/ice/page.tsx 2>/dev/null && echo "main OK" || echo "main NOT FOUND"',
        'ls /www/wwwroot/n11.namainvist.com/src/app/ice/page.tsx 2>/dev/null && echo "saas OK" || echo "saas NOT FOUND"',
        'echo "=== 10. PM2 ==="',
        'pm2 list | grep -E "saas|main"',
    ].join(' && ');

    conn.exec(cmd, (e, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
