const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== الـ Subdomains المسجّلة في n11_db ==="
psql -U n11_db -h localhost -d n11_db -c "
SELECT 
    subdomain,
    org_name,
    subscription_status,
    plan,
    trial_ends_at::date as trial_ends,
    invoice_quota,
    product_quota,
    created_at::date as joined
FROM tenant_accounts 
ORDER BY created_at DESC;
"

echo ""
echo "=== قواعد البيانات الموجودة على PostgreSQL ==="
psql -U n11_db -h localhost -d n11_db -c "SELECT datname FROM pg_database WHERE datname LIKE '%_db' ORDER BY datname;"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
