const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    // Check DB exists and has tables
    conn.exec(`
ls -la /tmp/provision_*.log 2>/dev/null || echo "No provision logs"
echo "--- DBs ---"
sudo -u postgres psql -h localhost -p 5432 -U postgres -t -c "SELECT datname FROM pg_database WHERE datname LIKE '%_db' ORDER BY datname;"
echo "--- Checking yessip_db tables ---"
sudo -u postgres psql -h localhost -p 5432 -U postgres -d yessip_db -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;" 2>/dev/null || echo "yessip_db does not exist or has no tables"
echo "--- Settings in yessip_db ---"
sudo -u postgres psql -h localhost -p 5432 -U postgres -d yessip_db -t -c "SELECT key, value FROM settings WHERE key IN ('company_name','tax_number') LIMIT 5;" 2>/dev/null || echo "No settings table / no data"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
