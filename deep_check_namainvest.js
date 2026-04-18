const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== All tables in namainvest_db ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -d namainvest_db -t -c \
  "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"

echo ""
echo "=== ALL settings rows ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -d namainvest_db -c \
  "SELECT id, key, value FROM settings ORDER BY id LIMIT 30;" 2>/dev/null

echo ""
echo "=== Settings count ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -d namainvest_db -t -c \
  "SELECT count(*) FROM settings;" 2>/dev/null

echo ""
echo "=== What user owns namainvest_db ==="
sudo -u postgres psql -h localhost -p 5432 -U postgres -t -c \
  "SELECT datname, pg_catalog.pg_get_userbyid(datdba) as owner FROM pg_database WHERE datname='namainvest_db';"

echo ""
echo "=== Test direct API with full response ==="
TOKEN=\$(curl -s -X POST http://127.0.0.1:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Host: namainvest.namainvist.com" \
  -d '{"username":"admin","password":"admin"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)

RESULT=\$(curl -s http://127.0.0.1:3500/api/settings \
  -H "Host: namainvest.namainvist.com" \
  -H "Authorization: Bearer \$TOKEN")
echo "Settings count: \$(echo \$RESULT | python3 -c 'import sys,json; d=json.load(sys.stdin); print(len(d))' 2>/dev/null)"
echo "Sample: \$(echo \$RESULT | python3 -c 'import sys,json; d=json.load(sys.stdin); [print(x) for x in d[:5]]' 2>/dev/null)"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
