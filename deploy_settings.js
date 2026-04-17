const { Client } = require('ssh2');
const conn = new Client();
const N7  = '/www/wwwroot/n7.namainvist.com';
const N11 = '/www/wwwroot/n11.namainvist.com';

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) { console.error(err); conn.end(); return; }

        const uploads = [
            { local: 'd:/namasoft9-3-main/src/app/(dashboard)/settings/page.tsx', remote: `${N7}/src/app/(dashboard)/settings/page.tsx` },
            { local: 'd:/namasoft9-3-main/src/app/(dashboard)/settings/page.tsx', remote: `${N11}/src/app/(dashboard)/settings/page.tsx` },
        ];

        let i = 0;
        function next() {
            if (i >= uploads.length) {
                console.log('✅ Uploaded to both');
                build();
                return;
            }
            const u = uploads[i++];
            sftp.fastPut(u.local, u.remote, {}, (e) => {
                if (e) console.error('❌', e.message);
                else console.log(`✅ → ${u.remote.includes('n11') ? 'n11' : 'n7'}`);
                next();
            });
        }

        function build() {
            const cmd = `
echo "=== Build n11 ==="
cd ${N11} && npm run build 2>&1 | grep -E "✓|✗|error" | tail -3
ls .next/BUILD_ID && echo "✅ n11 OK"

echo "=== Build n7 ==="
cd ${N7} && npm run build 2>&1 | grep -E "✓|✗|error" | tail -3
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
