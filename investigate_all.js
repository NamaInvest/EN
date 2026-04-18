const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== saas-dev info ==="
pm2 show 26 | grep -E "name|script|cwd|port|pid|uptime|status"

echo ""
echo "=== n7.namainvist.com - ايش هو؟ ==="
ls /www/wwwroot/n7.namainvist.com/ | head -5
cat /www/wwwroot/n7.namainvist.com/package.json 2>/dev/null | grep -E '"name"|"version"|"description"' | head -5

echo ""
echo "=== قواعد البيانات القديمة - عدد الجداول ==="
for db in n1_db n2_db n3_db n4_db n5_db n6_db n7_db n8_db n9_db n10_db 11_db 23_db test_db_final; do
  COUNT=$(sudo -u postgres psql -h localhost -p 5432 -U postgres -d $db -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tr -d ' ')
  SALES=$(sudo -u postgres psql -h localhost -p 5432 -U postgres -d $db -t -c "SELECT count(*) FROM sales_invoices;" 2>/dev/null | tr -d ' ')
  echo "$db: tables=$COUNT | sales=$SALES"
done

echo ""
echo "=== الباك آب folders ==="
du -sh /www/wwwroot/n11_backup_20260415_0120 2>/dev/null
du -sh /www/wwwroot/namainvist.com_backup_20260414 2>/dev/null
du -sh /www/wwwroot/namainvist.com_backup_2026-04-15T23-12-09-465Z 2>/dev/null
du -sh /www/wwwroot/namainvist.com_backup_before_edit_ 2>/dev/null
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
