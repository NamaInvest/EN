const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // 1. Create tenant_registry table in nama_main_db
    conn.exec(`
psql -U n11_db -h localhost -d nama_main_db -c "
CREATE TABLE IF NOT EXISTS tenant_registry (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    subdomain VARCHAR(100) NOT NULL,
    db_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    company_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);
" 2>&1

echo "--- Check table created ---"
psql -U n11_db -h localhost -d nama_main_db -c "SELECT column_name FROM information_schema.columns WHERE table_name='tenant_registry';" 2>/dev/null

echo "--- Insert namainvest record ---"
# Insert the existing namainvest tenant (your account)
psql -U n11_db -h localhost -d nama_main_db -c "
INSERT INTO tenant_registry (clerk_user_id, subdomain, db_name, email, company_name)
VALUES ('user_2xxxxxxxxxxx', 'namainvest', 'namainvest_db', 'ialqrashi62@gmail.com', 'نما انفست')
ON CONFLICT (clerk_user_id) DO NOTHING;
" 2>/dev/null || true

echo "--- Current records ---"
psql -U n11_db -h localhost -d nama_main_db -c "SELECT * FROM tenant_registry;" 2>/dev/null
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
