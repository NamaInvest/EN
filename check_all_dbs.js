const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
echo "=== n11_db tables ==="
sudo -u postgres psql -d n11_db -c "SELECT count(*) FROM pg_tables WHERE schemaname='public';" 2>/dev/null
sudo -u postgres psql -d n11_db -c "SELECT tablename FROM pg_tables WHERE schemaname='public' LIMIT 5;" 2>/dev/null

echo "=== هل هناك DATABASE أخرى؟ ==="
sudo -u postgres psql -tAc "SELECT datname FROM pg_database WHERE datname NOT IN ('postgres','template0','template1');" 2>/dev/null

echo "=== فحص node يقرأ n7_db فعلاً ==="
cd /www/wwwroot/n7.namainvist.com
node -e "
const { PrismaClient } = require('./node_modules/@prisma/client');
const c = new PrismaClient();
c.user.count().then(n => console.log('Users in DB:', n)).catch(e => console.log('Error:', e.message));
c.\$disconnect();
" 2>/dev/null
`;
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
