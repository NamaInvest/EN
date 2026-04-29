const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== جميع الحسابات في tenant_accounts ==="
psql -U n11_db -h localhost -d n11_db -c "SELECT id, subdomain, user_email, org_name, status, clerk_user_id, created_at FROM tenant_accounts ORDER BY id;" 2>/dev/null

echo ""
echo "=== قواعد البيانات الموجودة (_db) ==="
psql -U n11_db -h localhost -d n11_db -t -c "SELECT datname FROM pg_database WHERE datname LIKE '%_db' ORDER BY datname;" 2>/dev/null

echo ""
echo "=== عدد المستخدمين في كل قاعدة بيانات ==="
for db in namainvest_db leave_db n11_db; do
    COUNT=$(psql -U n11_db -h localhost -d $db -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
    echo "  $db -> $COUNT users"
done
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
