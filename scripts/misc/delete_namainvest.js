const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== حذف namainvest من tenant_accounts ==="
psql -U n11_db -h localhost -d n11_db -c "DELETE FROM tenant_accounts WHERE subdomain='namainvest' RETURNING id, subdomain, user_email;" 2>/dev/null

echo ""
echo "=== حذف قاعدة بيانات namainvest_db ==="
psql -U n11_db -h localhost -c "DROP DATABASE IF EXISTS namainvest_db;" 2>/dev/null && echo "✅ تم حذف namainvest_db" || echo "❌ فشل الحذف"

echo ""
echo "=== التحقق النهائي ==="
psql -U n11_db -h localhost -d n11_db -c "SELECT COUNT(*) as remaining FROM tenant_accounts;" 2>/dev/null
psql -U n11_db -h localhost -t -c "SELECT datname FROM pg_database WHERE datname='namainvest_db';" 2>/dev/null | grep -q namainvest && echo "لا يزال موجود!" || echo "✅ namainvest_db محذوفة نهائياً"
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
