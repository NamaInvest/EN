const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== namainvest_db check ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -t -c "SELECT datname FROM pg_database WHERE datname LIKE 'namainvest%';"

echo "=== Settings in namainvest_db ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -d namainvest_db -t -c \
  "SELECT key, value FROM settings WHERE key IN ('company_name','company_name_en','company_phone','tax_number','zatca_city','branch_name_en') ORDER BY key;" 2>/dev/null || echo "DB NOT FOUND"

echo "=== Users ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -d namainvest_db -t -c \
  "SELECT id, username, role FROM users;" 2>/dev/null

echo "=== API Settings test ==="
TOKEN=\$(curl -s -X POST http://127.0.0.1:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Host: namainvest.namainvist.com" \
  -d '{"username":"admin","password":"admin"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token','NO_TOKEN'))" 2>/dev/null)
echo "Token: \${TOKEN:0:40}..."

echo ""
echo "=== Settings API ==="
curl -s http://127.0.0.1:3500/api/settings \
  -H "Host: namainvest.namainvist.com" \
  -H "Authorization: Bearer \$TOKEN" | python3 -c "
import sys,json
data=json.load(sys.stdin)
if isinstance(data, list):
    for s in data[:10]: print(s.get('key'), '=', s.get('value'))
else:
    print('ERROR:', data)
" 2>/dev/null
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
