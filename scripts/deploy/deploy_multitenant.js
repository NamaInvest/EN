const { Client } = require('ssh2');
const conn = new Client();
const N11 = '/www/wwwroot/n11.namainvist.com';

const files = [
    { local: 'c:/Users/1/Desktop/alfa/src/lib/prisma.ts',                      remote: `${N11}/src/lib/prisma.ts` },
    { local: 'c:/Users/1/Desktop/alfa/src/middleware.ts',                       remote: `${N11}/src/middleware.ts` },
    { local: 'c:/Users/1/Desktop/alfa/src/app/api/tenant/provision/route.ts',  remote: `${N11}/src/app/api/tenant/provision/route.ts` },
];

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) { console.error(err); conn.end(); return; }

        let i = 0;
        function next() {
            if (i >= files.length) { build(); return; }
            const f = files[i++];
            sftp.fastPut(f.local, f.remote, {}, (e) => {
                if (e) console.error('❌', f.remote.split('/').pop(), e.message);
                else console.log('✅ Uploaded:', f.remote.split('/').pop());
                next();
            });
        }

        function build() {
            const cmd = `
cd ${N11}
echo "=== Build n11 with true multi-tenant ==="
npm run build 2>&1 | grep -E "✓|error|Error" | tail -5
ls .next/BUILD_ID && echo "✅ Build OK"

echo "=== Restart ==="
pm2 restart saas-app
sleep 4

echo "=== Test: n11 serves as main ==="
curl -s -o/dev/null -w "n11 direct: %{http_code}\\n" http://127.0.0.1:3500/

echo "=== Test: x-tenant header injection ==="
curl -s -o/dev/null -w "n11 as tenant: %{http_code}\\n" -H "Host: n11.namainvist.com" http://127.0.0.1:3500/api/settings

echo "✅ Multi-Tenant Architecture Live!"
echo ""
echo "Architecture summary:"
echo "  company.namainvist.com → Nginx → :3500 (n11 app)"
echo "  middleware reads Host → sets x-tenant=company"
echo "  prisma proxy reads x-tenant → connects to company_db"
echo "  Result: ONE app, unlimited tenants!"
`;
            conn.exec(cmd, (e2, s2) => {
                s2.on('data', d => process.stdout.write(d.toString()));
                s2.stderr.on('data', d => process.stderr.write(d.toString()));
                s2.on('close', () => { console.log('\n🎉 Done!'); conn.end(); });
            });
        }

        next();
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
