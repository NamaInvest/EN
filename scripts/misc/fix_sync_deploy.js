const { Client } = require('ssh2');
const conn = new Client();
const N7 = '/www/wwwroot/n7.namainvist.com';

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        sftp.fastPut(
            'c:/Users/1/Desktop/alfa/src/app/api/auth/sync/route.ts',
            `${N7}/src/app/api/auth/sync/route.ts`,
            {},
            (e) => {
                if (e) { console.error('Upload error:', e); conn.end(); return; }
                console.log('✅ sync/route.ts uploaded');

                // Delete ibraheem from n7_db and n11_db
                const cmd = `
echo "=== حذف ibraheem من n7_db ==="
cd ${N7}
node -e "
const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();
p.user.deleteMany({ where: { username: { not: 'admin' } } })
    .then(r => { console.log('Deleted users:', r.count); return p.\$disconnect(); })
    .catch(e => { console.log('Error:', e.message); return p.\$disconnect(); });
"

echo "=== المستخدمون المتبقون في n7 ==="
node -e "
const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();
p.user.findMany().then(u => { u.forEach(x => console.log(x.id, x.username, x.role)); return p.\$disconnect(); });
"

echo "=== إعادة بناء n7 مع الإصلاح ==="
npm run build 2>&1 | grep -E "✓|✗|error" | tail -5
ls .next/BUILD_ID 2>/dev/null && echo "✅ n7 build OK" || echo "❌ build failed"

echo "=== إعادة تشغيل saas-dev ==="
pm2 restart saas-dev
pm2 list | grep -E "saas|ice|main"
`;
                conn.exec(cmd, (err2, s2) => {
                    s2.on('data', d => process.stdout.write(d.toString()));
                    s2.stderr.on('data', d => process.stderr.write(d.toString()));
                    s2.on('close', () => conn.end());
                });
            }
        );
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
