const { Client } = require('ssh2');
const conn = new Client();
const N7 = '/www/wwwroot/n7.namainvist.com';

conn.on('ready', () => {
    const cmd = `
echo "=== نسخ schema (هيكل فقط) من n11_db إلى n7_db ==="
sudo -u postgres pg_dump --schema-only n11_db | sudo -u postgres psql n7_db 2>&1 | tail -5
echo "✅ Schema copied"

echo "=== تحقق من التابلز ==="
sudo -u postgres psql -d n7_db -c "SELECT count(*) as tables FROM pg_tables WHERE schemaname='public';" 2>/dev/null

echo "=== Seed n7_db (node مباشرة) ==="
cd ${N7}
node << 'SEEDEOF'
const { PrismaClient } = require('./node_modules/@prisma/client');
const bcrypt = require('./node_modules/bcryptjs');
const client = new PrismaClient();

async function seed() {
    const hash = bcrypt.hashSync('admin', 10);
    await client.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            passwordHash: hash,
            fullName: 'مدير النظام',
            role: 'owner',
            active: true,
            phone: ''
        }
    });
    console.log('✅ Admin user created');

    // Default warehouse
    await client.stock.upsert({
        where: { id: 1 },
        update: {},
        create: { name: 'المستودع الرئيسي', address: '' }
    });
    console.log('✅ Default stock created');

    // Default units
    for (const name of ['حبة','كرتون','كيلو','جرام','لتر','متر','علبة','كيس','طن']) {
        await client.unit.create({ data: { name } }).catch(() => {});
    }
    console.log('✅ Units created');

    await client.$disconnect();
}
seed().catch(e => { console.error('❌', e.message); process.exit(1); });
SEEDEOF

echo "=== تحقق المستخدمين ==="
sudo -u postgres psql -d n7_db -c 'SELECT id, username, "fullName", role FROM "User";' 2>/dev/null
`;

    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
