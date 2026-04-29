const { Client } = require('ssh2');
const conn = new Client();
const N7  = '/www/wwwroot/n7.namainvist.com';
const N11 = '/www/wwwroot/n11.namainvist.com';

const files = [
    { local: 'c:/Users/1/Desktop/alfa/src/lib/getDefaults.ts',        remote: 'src/lib/getDefaults.ts' },
    { local: 'c:/Users/1/Desktop/alfa/src/app/api/sales/route.ts',    remote: 'src/app/api/sales/route.ts' },
    { local: 'c:/Users/1/Desktop/alfa/src/app/api/purchases/route.ts', remote: 'src/app/api/purchases/route.ts' },
    { local: 'c:/Users/1/Desktop/alfa/src/app/api/expenses/route.ts', remote: 'src/app/api/expenses/route.ts' },
    { local: 'c:/Users/1/Desktop/alfa/prisma/seed.ts',                remote: 'prisma/seed.ts' },
];

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) { console.error(err); conn.end(); return; }

        let i = 0;
        function next() {
            if (i >= files.length) { build(); return; }
            const f = files[i++];
            const targets = [`${N7}/${f.remote}`, `${N11}/${f.remote}`];
            let j = 0;
            function nextTarget() {
                if (j >= targets.length) { next(); return; }
                const t = targets[j++];
                sftp.fastPut(f.local, t, {}, (e) => {
                    if (e) console.error('❌', t, e.message);
                    else console.log(`✅ ${f.remote} → ${t.includes('n11') ? 'n11' : 'n7'}`);
                    nextTarget();
                });
            }
            nextTarget();
        }

        function build() {
            const cmd = `
echo "=== Linking main stock to main branch on n11 ==="
cd ${N11}
node -e "
const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();
async function run() {
    // ربط المستودع الرئيسي بالفرع الرئيسي
    const branch = await p.branch.findFirst({ orderBy: { id: 'asc' } });
    if (branch) {
        await p.stock.update({ where: { id: 1 }, data: { branchId: branch.id } });
        console.log('Linked stock(1) → branch(' + branch.id + ':', branch.name + ')');
    } else {
        console.log('No branch found in n11, stock.branchId remains null');
    }
    await p['\$disconnect']();
}
run().catch(e => { console.error(e.message); });
" 2>/dev/null || echo "Prisma exec issue - continuing"

echo "=== Linking stock to branch on n7 ==="
cd ${N7}
node -e "
const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();
async function run() {
    const branch = await p.branch.findFirst({ orderBy: { id: 'asc' } });
    if (branch) {
        await p.stock.update({ where: { id: 1 }, data: { branchId: branch.id } });
        console.log('Linked stock(1) → branch(' + branch.id + ':', branch.name + ')');
    } else {
        console.log('No branch found in n7, stock.branchId remains null');
    }
    await p['\$disconnect']();
}
run().catch(e => { console.error(e.message); });
" 2>/dev/null || echo "Prisma exec issue - continuing"

echo "=== Build n11 ==="
cd ${N11} && npm run build 2>&1 | grep -E "✓|error" | tail -3
ls .next/BUILD_ID && echo "✅ n11 OK"

echo "=== Build n7 ==="
cd ${N7} && npm run build 2>&1 | grep -E "✓|error" | tail -3
ls .next/BUILD_ID && echo "✅ n7 OK"

echo "=== Restart ==="
pm2 restart saas-app saas-dev
sleep 4
curl -s -o/dev/null -w "n11: %{http_code}\\n" http://127.0.0.1:3500/
curl -s -o/dev/null -w "n7:  %{http_code}\\n" http://127.0.0.1:3600/
`;
            conn.exec(cmd, (e2, s2) => {
                s2.on('data', d => process.stdout.write(d.toString()));
                s2.stderr.on('data', d => process.stderr.write(d.toString()));
                s2.on('close', () => { console.log('🎉 Done'); conn.end(); });
            });
        }

        next();
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
