const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== أعمدة جدول tenant_accounts ==="
psql -U n11_db -h localhost -d n11_db -c "\d tenant_accounts"

echo ""
echo "=== بيانات tenant_accounts الكاملة ==="
psql -U n11_db -h localhost -d n11_db -c "SELECT * FROM tenant_accounts ORDER BY created_at DESC;"

echo ""
echo "=== مستخدمو mgmg_db ==="
psql -U n11_db -h localhost -d mgmg_db -c "SELECT id, username, full_name, email, role, created_at::date FROM users ORDER BY id;" 2>/dev/null || echo "جدول users غير موجود أو اسم مختلف"

echo ""
echo "=== تحقق من اسم جدول المستخدمين ==="
psql -U n11_db -h localhost -d mgmg_db -c "\dt" 2>/dev/null | head -30
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
