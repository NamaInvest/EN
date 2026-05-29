const { Client } = require('ssh2');
const conn = new Client();

// Test directly: connect to n11_db using postgres user (what main-site uses) 
conn.on('ready', () => {
    conn.exec(`
echo "=== Test: can postgres user connect to n11_db? ==="
psql -U postgres -h localhost -d n11_db -c "SELECT subdomain, clerk_user_id FROM tenant_accounts LIMIT 3;" 2>&1

echo ""
echo "=== Test: can n11_db user connect to n11_db? ==="
psql -U n11_db -h localhost -d n11_db -c "SELECT subdomain, clerk_user_id FROM tenant_accounts LIMIT 3;" 2>/dev/null

echo ""
echo "=== Check if MASTER_DB_URL is in main-site .env ==="
grep MASTER_DB_URL /www/wwwroot/namainvist.com/.env 2>/dev/null || echo "NOT SET - using hardcoded n11_db:n11_pass123"

echo ""
echo "=== Test hardcoded connection ==="
PGPASSWORD=n11_pass123 psql -U n11_db -h localhost -d n11_db -c "SELECT subdomain, clerk_user_id FROM tenant_accounts;" 2>&1
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
