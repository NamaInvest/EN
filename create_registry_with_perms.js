const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
# Grant permissions to n11_db user in nama_main_db
psql -U postgres -d nama_main_db -c "GRANT CREATE ON SCHEMA public TO n11_db;" 2>/dev/null
psql -U postgres -d nama_main_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO n11_db;" 2>/dev/null

# Create tenant_registry table
psql -U n11_db -h localhost -d nama_main_db -c "
CREATE TABLE IF NOT EXISTS tenant_registry (
    id SERIAL PRIMARY KEY,
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    subdomain VARCHAR(100) NOT NULL,
    db_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    company_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);" 2>&1

echo "Table created. Now check columns:"
psql -U n11_db -h localhost -d nama_main_db -c "SELECT column_name FROM information_schema.columns WHERE table_name='tenant_registry';" 2>/dev/null
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
