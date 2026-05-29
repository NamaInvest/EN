const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
sudo -u postgres psql -h localhost -p 5432 -U postgres -d n11_db -c "DELETE FROM tenant_accounts WHERE subdomain IN ('bablus','ajyad','nmmawill','namainvest');"
sudo -u postgres psql -h localhost -p 5432 -U postgres -c "DROP DATABASE bablus_db;" 2>/dev/null || echo 'bablus_db: already gone'
sudo -u postgres psql -h localhost -p 5432 -U postgres -c "DROP DATABASE ajyad_db;" 2>/dev/null || echo 'ajyad_db: already gone'
sudo -u postgres psql -h localhost -p 5432 -U postgres -c "DROP DATABASE nmmawill_db;" 2>/dev/null || echo 'nmmawill_db: already gone'
sudo -u postgres psql -h localhost -p 5432 -U postgres -c "DROP DATABASE namainvest_db;" 2>/dev/null || echo 'namainvest_db: already gone'
sudo -u postgres psql -h localhost -p 5432 -U postgres -c "DROP DATABASE test_prisma_create_db;" 2>/dev/null || echo 'test_db: already gone'
echo "✅ All old tenants cleaned"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
