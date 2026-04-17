const { Client } = require('ssh2');
const conn = new Client();

// المسارات الـ 4 (n7 و n11 تم نشرهم مسبقاً، نضيفهم مرة أخرى للتأكد)
const SERVERS = [
    '/www/wwwroot/ice.namainvist.com',
    '/www/wwwroot/namainvist.com',
    '/www/wwwroot/n11.namainvist.com',
    '/www/wwwroot/n7.namainvist.com',
];

const files = [
    { local: 'd:/namasoft9-3-main/src/lib/getDefaults.ts',              remote: 'src/lib/getDefaults.ts' },
    { local: 'd:/namasoft9-3-main/src/app/api/sales/route.ts',          remote: 'src/app/api/sales/route.ts' },
    { local: 'd:/namasoft9-3-main/src/app/api/purchases/route.ts',      remote: 'src/app/api/purchases/route.ts' },
    { local: 'd:/namasoft9-3-main/src/app/api/expenses/route.ts',       remote: 'src/app/api/expenses/route.ts' },
    { local: 'd:/namasoft9-3-main/src/app/api/auth/sync/route.ts',      remote: 'src/app/api/auth/sync/route.ts' },
    { local: 'd:/namasoft9-3-main/src/app/(dashboard)/settings/page.tsx', remote: 'src/app/(dashboard)/settings/page.tsx' },
    { local: 'd:/namasoft9-3-main/prisma/seed.ts',                      remote: 'prisma/seed.ts' },
];

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) { console.error(err); conn.end(); return; }

        // Generate all upload tasks (file × server)
        const tasks = [];
        for (const s of SERVERS) {
            for (const f of files) {
                tasks.push({ local: f.local, remote: `${s}/${f.remote}`, label: `${s.split('/').pop()}/${f.remote.split('/').pop()}` });
            }
        }

        let i = 0;
        function nextUpload() {
            if (i >= tasks.length) { linkAndBuild(); return; }
            const t = tasks[i++];
            sftp.fastPut(t.local, t.remote, {}, (e) => {
                if (e) console.error(`❌ ${t.label}:`, e.message);
                else console.log(`✅ ${t.label}`);
                nextUpload();
            });
        }

        function linkAndBuild() {
            console.log('\n🔧 Linking stocks → branches and rebuilding...\n');

            // شرط: link stock→branch لكل سيرفر + rebuild
            const linkScript = (dir) => `
echo "=== [${dir.split('/').pop()}] Link stock → branch ==="
cd ${dir}
node << 'NODEEOF'
const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();
async function run() {
    const branch = await p.branch.findFirst({ orderBy: { id: 'asc' } });
    if (branch) {
        await p.stock.update({ where: { id: 1 }, data: { branchId: branch.id } });
        console.log('-> stock(1) linked to branch(' + branch.id + ':', branch.name + ')');
    } else {
        console.log('-> No branch found, stock.branchId stays null');
    }
    const users = await p.user.deleteMany({ where: { username: { not: 'admin' } } });
    console.log('-> Cleaned extra users:', users.count);
    await p['$disconnect']();
}
run().catch(e => console.error(e.message));
NODEEOF

echo "=== [${dir.split('/').pop()}] Build ==="
cd ${dir}
npm run build 2>&1 | grep -E "✓|error|Error" | tail -3
ls .next/BUILD_ID 2>/dev/null && echo "✅ ${dir.split('/').pop()} OK" || echo "❌ build failed"
`;

            const allCmds = SERVERS.map(s => linkScript(s)).join('\n') + `
echo "=== Restart ALL ==="
pm2 restart ice main-site saas-app saas-dev
sleep 5
pm2 list | grep -E "online|error"
curl -s -o/dev/null -w "main:  %{http_code}\\n" http://127.0.0.1:3000/ 2>/dev/null || true
curl -s -o/dev/null -w "ice:   %{http_code}\\n" http://127.0.0.1:3100/ 2>/dev/null || true
curl -s -o/dev/null -w "n11:   %{http_code}\\n" http://127.0.0.1:3500/
curl -s -o/dev/null -w "n7:    %{http_code}\\n" http://127.0.0.1:3600/
`;

            conn.exec(allCmds, (e2, s2) => {
                s2.on('data', d => process.stdout.write(d.toString()));
                s2.stderr.on('data', d => process.stderr.write(d.toString()));
                s2.on('close', () => {
                    console.log('\n🎉 All servers updated!');
                    conn.end();
                });
            });
        }

        nextUpload();
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
