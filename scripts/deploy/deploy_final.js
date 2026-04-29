const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
const MASTER = '/www/wwwroot/n11.namainvist.com';

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) { console.error(err); conn.end(); return; }

        const uploads = [
            { local: 'c:/Users/1/Desktop/alfa/src/lib/prisma.ts',      remote: `${MASTER}/src/lib/prisma.ts` },
            { local: 'c:/Users/1/Desktop/alfa/src/middleware.ts',       remote: `${MASTER}/src/middleware.ts` },
            { local: 'c:/Users/1/Desktop/alfa/ecosystem.config.js',     remote: `${MASTER}/ecosystem.config.js` },
        ];

        let i = 0;
        function next() {
            if (i >= uploads.length) {
                console.log('✅ All files uploaded. Building...');
                runBuild();
                return;
            }
            const u = uploads[i++];
            sftp.fastPut(u.local, u.remote, {}, (e) => {
                if (e) { console.error('Upload error:', u.local, e.message); conn.end(); return; }
                console.log(`✅ Uploaded: ${u.local.split('/').pop()}`);
                next();
            });
        }
        next();

        function runBuild() {
            const cmd = `
cd ${MASTER}
echo "=== Removing old .next ==="
rm -rf .next
echo "=== Building ==="
npm run build 2>&1 | tail -20
echo ""
echo "=== Build result ==="
ls -la .next/BUILD_ID 2>/dev/null && echo "BUILD_ID found ✅" || echo "BUILD_ID missing ❌"
echo "=== Stopping old saas-app ==="
pm2 delete saas-app 2>/dev/null || true
echo "=== Starting with ecosystem.config.js ==="
pm2 start ecosystem.config.js
pm2 save --force
echo "=== Waiting 8 seconds for startup ==="
sleep 8
echo "=== PM2 Status ==="
pm2 list | grep -E "saas|main|ice"
echo "=== Testing ==="
curl -s -o /dev/null -w "HTTP %{http_code}\\n" -H "Host: n11.namainvist.com" http://127.0.0.1:3500/ 2>/dev/null
curl -s -H "Host: n11.namainvist.com" http://127.0.0.1:3500/api/auth/login \\
  -X POST -H "Content-Type: application/json" \\
  -d '{"username":"admin","password":"admin"}' 2>/dev/null | head -c 150
echo ""
echo "=== Logs ==="
pm2 logs saas-app --lines 5 --nostream 2>/dev/null | grep -v "^\\[" | tail -8
`;
            conn.exec(cmd, (execErr, stream) => {
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => {
                    console.log('\n🎉 Done!');
                    conn.end();
                });
            });
        }
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
