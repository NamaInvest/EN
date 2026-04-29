const { Client } = require('ssh2');
const conn = new Client();
const N7  = '/www/wwwroot/n7.namainvist.com';

conn.on('ready', () => {
    const cmd = `
echo "=== إصلاح n7_db: schema + seed ==="
cd ${N7}

echo ">> prisma db push (force)"
DATABASE_URL="postgresql://postgres:RootPassNama123@localhost:5432/n7_db?schema=public" \\
  npx prisma db push --accept-data-loss --skip-generate 2>&1

echo ">> seed n7_db"
DATABASE_URL="postgresql://postgres:RootPassNama123@localhost:5432/n7_db?schema=public" \\
  npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts 2>&1 | tail -15

echo "=== تحقق من المستخدمين في n7_db ==="
sudo -u postgres psql -d n7_db -c 'SELECT id, username, "fullName", role FROM "User";' 2>/dev/null

echo "=== تابل موجودة في n7_db ==="
sudo -u postgres psql -d n7_db -c "\\dt" 2>/dev/null | grep -E "User|Setting|Stock" | head -10
`;

    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => {
            console.log('\n✅ Done fixing n7_db');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
