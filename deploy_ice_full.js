const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`
echo "=== Migration: إضافة user_quota ==="
psql -U n11_db -h localhost -d n11_db -c "
ALTER TABLE tenant_accounts ADD COLUMN IF NOT EXISTS user_quota INT DEFAULT 1;
UPDATE tenant_accounts SET user_quota = 1 WHERE user_quota IS NULL;
SELECT subdomain, user_quota FROM tenant_accounts;
"
echo "✅ Migration done"
    `, (e, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => {
            console.log('\n📤 Uploading files...');
            conn.sftp((e2, sftp) => {
                if (e2) throw e2;
                const upload = (local, remote, label) => new Promise((res, rej) =>
                    sftp.fastPut(local, remote, {}, err => {
                        if (err) { console.error(`❌ ${label}:`, err.message); rej(err); }
                        else { console.log(`✅ ${label}`); res(); }
                    })
                );
                const mkdirp = (path) => new Promise(r => {
                    conn.exec(`mkdir -p ${path}`, (e, s) => { s.resume(); s.on('close', r); });
                });
                const run = async () => {
                    // Ensure dirs exist
                    await mkdirp('/www/wwwroot/namainvist.com/src/app/ice');
                    await mkdirp('/www/wwwroot/n11.namainvist.com/src/app/ice');

                    // Upload to saas-app (n11)
                    await upload('d:/namasoft9-3-main/src/lib/quotaGuard.ts', '/www/wwwroot/n11.namainvist.com/src/lib/quotaGuard.ts', 'quotaGuard.ts (saas)');
                    await upload('d:/namasoft9-3-main/src/app/api/ice/tenants/route.ts', '/www/wwwroot/n11.namainvist.com/src/app/api/ice/tenants/route.ts', 'ice/tenants (saas)');
                    await upload('d:/namasoft9-3-main/src/app/api/ice/toggle/route.ts', '/www/wwwroot/n11.namainvist.com/src/app/api/ice/toggle/route.ts', 'ice/toggle (saas)');
                    await upload('d:/namasoft9-3-main/src/app/ice/page.tsx', '/www/wwwroot/n11.namainvist.com/src/app/ice/page.tsx', 'ice/page (saas)');

                    // Upload to main-site
                    await upload('d:/namasoft9-3-main/src/app/ice/page.tsx', '/www/wwwroot/namainvist.com/src/app/ice/page.tsx', 'ice/page (main)');
                    await upload('d:/namasoft9-3-main/src/app/api/ice/tenants/route.ts', '/www/wwwroot/namainvist.com/src/app/api/ice/tenants/route.ts', 'ice/tenants (main)');
                    await upload('d:/namasoft9-3-main/src/app/api/ice/toggle/route.ts', '/www/wwwroot/namainvist.com/src/app/api/ice/toggle/route.ts', 'ice/toggle (main)');
                    await upload('d:/namasoft9-3-main/src/components/Sidebar.tsx', '/www/wwwroot/n11.namainvist.com/src/components/Sidebar.tsx', 'Sidebar.tsx (saas)');

                    console.log('\n🔨 Building BOTH apps in background...');
                    conn.exec(`
rm -f /tmp/b_saas.flag /tmp/b_main.flag /tmp/e_saas.flag /tmp/e_main.flag
nohup bash -c 'cd /www/wwwroot/n11.namainvist.com && npm run build > /tmp/b_saas.log 2>&1 && pm2 restart saas-app && touch /tmp/b_saas.flag || touch /tmp/e_saas.flag' &
nohup bash -c 'cd /www/wwwroot/namainvist.com && npm run build > /tmp/b_main.log 2>&1 && pm2 restart main-site && touch /tmp/b_main.flag || touch /tmp/e_main.flag' &
echo "PIDS: $!"
                    `, (e3, s3) => {
                        s3.on('data', d => process.stdout.write(d.toString()));
                        s3.on('close', () => { console.log('\n⏳ Polling...'); conn.end(); });
                    });
                };
                run().catch(e => { console.error(e); conn.end(); });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });

let tries = 0;
const poll = () => {
    tries++;
    const c = new Client();
    c.on('ready', () => {
        c.exec(`
saas=$([ -f /tmp/b_saas.flag ] && echo "✅ SAAS_DONE" || ([ -f /tmp/e_saas.flag ] && echo "❌ SAAS_FAIL" || echo "⏳ SAAS_BUILDING"))
main=$([ -f /tmp/b_main.flag ] && echo "✅ MAIN_DONE" || ([ -f /tmp/e_main.flag ] && echo "❌ MAIN_FAIL" || echo "⏳ MAIN_BUILDING"))
echo "SAAS: $saas | MAIN: $main (${tries*15}s)"
if echo "$saas $main" | grep -q "FAIL"; then
  echo "--- SAAS ERROR ---"; tail -10 /tmp/b_saas.log; echo "--- MAIN ERROR ---"; tail -10 /tmp/b_main.log
fi
if echo "$saas" | grep -q "DONE" && echo "$main" | grep -q "DONE"; then
  pm2 list | grep -E "saas|main"
fi
        `, (e, s) => {
            let out = '';
            s.on('data', d => { out += d; process.stdout.write(d.toString()); });
            s.on('close', () => {
                c.end();
                const done = out.includes('SAAS_DONE') && out.includes('MAIN_DONE');
                const fail = out.includes('SAAS_FAIL') || out.includes('MAIN_FAIL');
                if (done || fail || tries >= 40) { console.log('\n✅ Done!'); return; }
                setTimeout(poll, 15000);
            });
        });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
};
setTimeout(poll, 20000);
