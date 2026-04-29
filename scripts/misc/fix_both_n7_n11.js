const { Client } = require('ssh2');
const conn = new Client();
const N7  = '/www/wwwroot/n7.namainvist.com';
const N11 = '/www/wwwroot/n11.namainvist.com';

const cleanScript = `
const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();
async function run() {
    const deleted = await p.user.deleteMany({ where: { username: { not: 'admin' } } });
    console.log('Deleted extra users:', deleted.count);
    const users = await p.user.findMany({ select: { id: true, username: true, role: true } });
    users.forEach(u => console.log(' -', u.id, u.username, u.role));
    await p['$disconnect']();
}
run().catch(e => { console.error(e.message); });
`;

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) { console.error(err); conn.end(); return; }

        const uploads = [
            // Upload fixed sync route to BOTH n7 and n11
            { local: 'c:/Users/1/Desktop/alfa/src/app/api/auth/sync/route.ts', remote: `${N7}/src/app/api/auth/sync/route.ts` },
            { local: 'c:/Users/1/Desktop/alfa/src/app/api/auth/sync/route.ts', remote: `${N11}/src/app/api/auth/sync/route.ts` },
        ];

        let i = 0;
        function uploadNext() {
            if (i >= uploads.length) {
                console.log('✅ All files uploaded');
                writeCleanScript();
                return;
            }
            const u = uploads[i++];
            sftp.fastPut(u.local, u.remote, {}, (e) => {
                if (e) { console.error('Upload error:', u.remote, e.message); }
                else console.log(`✅ ${u.remote.split('/').slice(-1)[0]} → ${u.remote.includes('n11') ? 'n11' : 'n7'}`);
                uploadNext();
            });
        }

        function writeCleanScript() {
            // Write cleanup script to both servers
            const writeN7 = sftp.createWriteStream(`${N7}/cleanup_users.js`);
            writeN7.write(cleanScript);
            writeN7.end();
            writeN7.on('close', () => {
                const writeN11 = sftp.createWriteStream(`${N11}/cleanup_users.js`);
                writeN11.write(cleanScript);
                writeN11.end();
                writeN11.on('close', () => {
                    console.log('✅ Cleanup scripts uploaded');
                    runCommands();
                });
            });
        }

        function runCommands() {
            const cmd = `
echo "=== [n7] حذف غير admin ==="
cd ${N7} && node cleanup_users.js && rm cleanup_users.js

echo "=== [n11] حذف غير admin ==="
cd ${N11} && node cleanup_users.js && rm cleanup_users.js

echo "=== [n11] إعادة بناء ==="
cd ${N11} && npm run build 2>&1 | grep -E "✓|✗|error|Error" | tail -5
ls ${N11}/.next/BUILD_ID 2>/dev/null && echo "✅ n11 build OK" || echo "❌ n11 build failed"

echo "=== [n7] إعادة بناء ==="
cd ${N7} && npm run build 2>&1 | grep -E "✓|✗|error|Error" | tail -5
ls ${N7}/.next/BUILD_ID 2>/dev/null && echo "✅ n7 build OK" || echo "❌ n7 build failed"

echo "=== إعادة تشغيل كلا التطبيقين ==="
pm2 restart saas-app
pm2 restart saas-dev
sleep 5
pm2 list | grep -E "saas|main|ice"
echo "=== Test n11 (3500) ==="
curl -s -o /dev/null -w "n11: HTTP %{http_code}\\n" http://127.0.0.1:3500/
echo "=== Test n7 (3600) ==="
curl -s -o /dev/null -w "n7:  HTTP %{http_code}\\n" http://127.0.0.1:3600/
`;
            conn.exec(cmd, (e2, s2) => {
                s2.on('data', d => process.stdout.write(d.toString()));
                s2.stderr.on('data', d => process.stderr.write(d.toString()));
                s2.on('close', () => {
                    console.log('\n🎉 Both n7 and n11 fixed!');
                    conn.end();
                });
            });
        }

        uploadNext();
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
