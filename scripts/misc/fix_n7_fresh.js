const { Client } = require('ssh2');
const conn = new Client();
const N7 = '/www/wwwroot/n7.namainvist.com';

conn.on('ready', () => {
    // First: drop and recreate n7_db
    // Then: push schema directly (no env override)
    // Then: seed with node directly
    const cmd = `
echo "=== 1. حذف وإعادة إنشاء n7_db ==="
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='n7_db';" 2>/dev/null
sudo -u postgres psql -c "DROP DATABASE IF EXISTS n7_db;" 2>/dev/null
sudo -u postgres psql -c "CREATE DATABASE n7_db OWNER postgres;" 2>/dev/null
echo "✅ n7_db created fresh"

echo "=== 2. تحقق من .env ==="
cat ${N7}/.env | grep DATABASE_URL

echo "=== 3. Prisma DB Push (من مجلد n7 مباشرة) ==="
cd ${N7} && npx prisma db push --accept-data-loss 2>&1

echo "=== 4. تحقق من التابلز ==="
sudo -u postgres psql -d n7_db -c "SELECT count(*) as tables FROM pg_tables WHERE schemaname='public';" 2>/dev/null

echo "=== 5. Seed مباشرة بـ node ==="
cd ${N7} && node -e "
const { PrismaClient } = require('./node_modules/@prisma/client');
const bcrypt = require('./node_modules/bcryptjs');
const prisma = new PrismaClient();

async function seed() {
    const hash = bcrypt.hashSync('admin', 10);
    const user = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: { username: 'admin', passwordHash: hash, fullName: 'مدير النظام', role: 'admin', active: true }
    });
    console.log('✅ User created:', user.id, user.username);
    await prisma.\$disconnect();
}
seed().catch(e => { console.error('❌', e.message); process.exit(1); });
" 2>&1

echo "=== 6. تحقق من المستخدم ==="
sudo -u postgres psql -d n7_db -c 'SELECT id, username, role FROM "User";' 2>/dev/null
`;

    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 });
