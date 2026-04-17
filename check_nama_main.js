const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
echo "=== Tables في nama_main_db ==="
sudo -u postgres psql -d nama_main_db -c "SELECT count(*) FROM pg_tables WHERE schemaname='public';" 2>/dev/null
sudo -u postgres psql -d nama_main_db -c "SELECT tablename FROM pg_tables WHERE schemaname='public' LIMIT 5;" 2>/dev/null

echo "=== Users في nama_main_db ==="
sudo -u postgres psql -d nama_main_db -c 'SELECT id, username, "fullName", role FROM "User" LIMIT 5;' 2>/dev/null

echo "=== تحقق من DATABASE_URL الحقيقي لـ n7 ==="
cat /www/wwwroot/n7.namainvist.com/.env | grep DATABASE_URL

echo "=== testdb99 tables ==="
sudo -u postgres psql -d testdb99 -c "SELECT count(*) FROM pg_tables WHERE schemaname='public';" 2>/dev/null

echo "=== هل الـ .env لـ n7 يشير لـ n7_db أو main؟ ==="
grep -A1 DATABASE /www/wwwroot/n7.namainvist.com/.env
`;
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
