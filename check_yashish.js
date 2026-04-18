const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== yashish DB check ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -t -c "SELECT datname FROM pg_database WHERE datname LIKE 'yashish%';"

echo "=== yashish_db settings ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -d yashish_db -t -c "SELECT key, value FROM settings WHERE key IN ('company_name','tax_number','company_phone') ORDER BY key;" 2>/dev/null || echo "yashish_db not found"

echo "=== yashish_db users ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -d yashish_db -t -c "SELECT id, username, role FROM users;" 2>/dev/null || echo "no users"

echo "=== provision logs ==="
ls -lt /tmp/provision_*.log 2>/dev/null | head -5
cat /tmp/provision_yashish.log 2>/dev/null || echo "no provision log for yashish"

echo "=== saas-app recent errors ==="
pm2 logs 25 --lines 30 --nostream 2>/dev/null | grep -i "error\|ERROR\|seed\|provision" | tail -20
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
