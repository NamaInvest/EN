const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
echo "=== n7 .env TENANT settings ==="
grep -E "TENANT|DATABASE_URL|PORT" /www/wwwroot/n7.namainvist.com/.env

echo "=== Tables في n7_db ==="
sudo -u postgres psql -d n7_db -c "\\dt" 2>/dev/null | head -20

echo "=== Users في n7_db (correct table name) ==="
sudo -u postgres psql -d n7_db -c 'SELECT id, username, role FROM "User" LIMIT 5;' 2>/dev/null || \
sudo -u postgres psql -d n7_db -c 'SELECT id, username, role FROM users LIMIT 5;' 2>/dev/null || \
echo "Table not found or empty"

echo "=== n7 prisma.ts (TENANT detection) ==="
head -20 /www/wwwroot/n7.namainvist.com/src/lib/prisma.ts
`;
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
