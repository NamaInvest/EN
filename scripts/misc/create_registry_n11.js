const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
# Create tenant_registry in n11_db (where we have full access)
psql -U n11_db -h localhost -d n11_db -c "
CREATE TABLE IF NOT EXISTS tenant_registry (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    subdomain VARCHAR(100) NOT NULL,
    db_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    company_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);" 2>&1

echo "--- Check columns ---"
psql -U n11_db -h localhost -d n11_db -c "SELECT column_name FROM information_schema.columns WHERE table_name='tenant_registry' ORDER BY ordinal_position;" 2>/dev/null

echo "--- Check clerk user id for namainvest ---"
psql -U n11_db -h localhost -d namainvest_db -c "SELECT id, username, role FROM users LIMIT 3;" 2>/dev/null

echo "--- Check settings for namainvest ---"
psql -U n11_db -h localhost -d namainvest_db -c "SELECT key, value FROM settings WHERE key IN ('clerk_user_id','company_name','company_phone') LIMIT 5;" 2>/dev/null
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
