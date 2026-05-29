const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== Add clerk_user_id column to tenant_accounts in n11_db ==="
psql -U n11_db -h localhost -d n11_db -c "
ALTER TABLE tenant_accounts ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255) UNIQUE;
" 2>&1

echo ""
echo "=== Check current tenant_accounts records ==="
psql -U n11_db -h localhost -d n11_db -c "SELECT id, user_email, subdomain, status, clerk_user_id FROM tenant_accounts LIMIT 10;" 2>/dev/null

echo ""
echo "=== Prisma migrate in n11_db for tenantAccount ==="
# We don't need full migration — just the column addition is enough
psql -U n11_db -h localhost -d n11_db -c "SELECT column_name FROM information_schema.columns WHERE table_name='tenant_accounts' ORDER BY ordinal_position;" 2>/dev/null
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
