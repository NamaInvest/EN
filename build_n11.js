const { Client } = require('ssh2');
const conn = new Client();
const N11 = '/www/wwwroot/n11.namainvist.com';

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) { console.error(err); conn.end(); return; }
        
        sftp.fastPut('d:/namasoft9-3-main/src/app/page.tsx', `${N11}/src/app/page.tsx`, {}, (e) => {
            if (e) { console.error('❌ page.tsx:', e.message); }
            sftp.fastPut('d:/namasoft9-3-main/src/components/SessionGuard.tsx', `${N11}/src/components/SessionGuard.tsx`, {}, (e2) => {
                if (e2) { console.error('❌ SessionGuard.tsx:', e2.message); }

                conn.exec(`
cd ${N11}
npm run build 2>&1 | tail -6
ls .next/BUILD_ID 2>/dev/null && echo "✅ Build OK" || echo "❌ Build FAILED"
pm2 restart saas-app
curl -s -o/dev/null -w "n11 (127.0.0.1:3500): %{http_code}\\n" http://127.0.0.1:3500/
`, (e3, s2) => {
                    s2.on('data', d => process.stdout.write(d.toString()));
                    s2.stderr.on('data', d => process.stderr.write(d.toString()));
                    s2.on('close', () => { console.log('🎉 Done Fixing UI'); conn.end(); });
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
