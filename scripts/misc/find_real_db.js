const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
echo "=== DATABASE_URL الفعلي للـ saas-app process ==="
PID=$(pm2 list | grep saas-app | awk '{print $12}' | grep -v "^$" | head -1)
echo "saas-app PID: $PID"
cat /proc/$PID/environ 2>/dev/null | tr '\\0' '\\n' | grep -E "DATABASE_URL|TENANT|PORT" || echo "Cannot read proc"

echo "=== DATABASE_URL لـ saas-dev process ==="
PID2=$(pm2 list | grep saas-dev | awk '{print $12}' | grep -v "^$" | head -1)
echo "saas-dev PID: $PID2"
cat /proc/$PID2/environ 2>/dev/null | tr '\\0' '\\n' | grep -E "DATABASE_URL|TENANT|PORT" || echo "Cannot read proc"

echo "=== كل قواعد البيانات الموجودة ==="
sudo -u postgres psql -tAc "SELECT datname FROM pg_database WHERE datname NOT IN ('postgres','template0','template1');" 2>/dev/null

echo "=== في أي DB يوجد User جدول؟ ==="
for db in $(sudo -u postgres psql -tAc "SELECT datname FROM pg_database WHERE datname NOT IN ('postgres','template0','template1');" 2>/dev/null); do
    count=$(sudo -u postgres psql -d "$db" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_name='User' AND table_schema='public';" 2>/dev/null | tr -d ' ')
    echo "  $db: User table count = $count"
done

echo "=== اتصال API مباشر على n7 ==="
curl -s http://127.0.0.1:3600/api/auth/login \\
  -X POST -H "Content-Type: application/json" \\
  -d '{"username":"admin","password":"admin"}' 2>/dev/null | head -c 300
`;
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
