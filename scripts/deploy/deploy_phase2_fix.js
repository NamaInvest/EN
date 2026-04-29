const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((e, sftp) => {
        if (e) throw e;
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
            await mkdirp('/www/wwwroot/namainvist.com/src/app/pricing');
            await mkdirp('/www/wwwroot/namainvist.com/src/components');

            // Sales API (has quotaGuard) → saas only
            await upload('c:/Users/1/Desktop/alfa/src/app/api/sales/route.ts',
                '/www/wwwroot/n11.namainvist.com/src/app/api/sales/route.ts', 'sales/route.ts (saas)');

            // QuotaModal → saas
            await upload('c:/Users/1/Desktop/alfa/src/components/QuotaModal.tsx',
                '/www/wwwroot/n11.namainvist.com/src/components/QuotaModal.tsx', 'QuotaModal (saas)');

            // Pricing page → main-site + saas
            await upload('c:/Users/1/Desktop/alfa/src/app/pricing/page.tsx',
                '/www/wwwroot/namainvist.com/src/app/pricing/page.tsx', 'pricing (main-site)');
            await upload('c:/Users/1/Desktop/alfa/src/app/pricing/page.tsx',
                '/www/wwwroot/n11.namainvist.com/src/app/pricing/page.tsx', 'pricing (saas)');

            console.log('\n🔨 Building both apps...');
            conn.exec(`
rm -f /tmp/f_saas.flag /tmp/f_main.flag /tmp/e2_saas.flag /tmp/e2_main.flag
nohup bash -c 'cd /www/wwwroot/n11.namainvist.com && npm run build > /tmp/f_saas.log 2>&1 && pm2 restart saas-app && touch /tmp/f_saas.flag || touch /tmp/e2_saas.flag' &
nohup bash -c 'cd /www/wwwroot/namainvist.com && npm run build > /tmp/f_main.log 2>&1 && pm2 restart main-site && touch /tmp/f_main.flag || touch /tmp/e2_main.flag' &
echo "Started"
            `, (e2, s2) => {
                s2.on('data', d => process.stdout.write(d.toString()));
                s2.on('close', () => { console.log('⏳ Polling...'); conn.end(); });
            });
        };
        run().catch(e => { console.error(e); conn.end(); });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });

let tries = 0;
const poll = () => {
    tries++;
    const c = new Client();
    c.on('ready', () => {
        c.exec(`
saas=$([ -f /tmp/f_saas.flag ] && echo "DONE" || ([ -f /tmp/e2_saas.flag ] && echo "FAIL" || echo "BUILDING (${tries*15}s)"))
main=$([ -f /tmp/f_main.flag ] && echo "DONE" || ([ -f /tmp/e2_main.flag ] && echo "FAIL" || echo "BUILDING (${tries*15}s)"))
echo "SAAS: $saas | MAIN: $main"
if echo "$saas $main" | grep -q "FAIL"; then echo "SAAS err:"; tail -8 /tmp/f_saas.log; echo "MAIN err:"; tail -8 /tmp/f_main.log; fi
if [ "$saas" = "DONE" ] && [ "$main" = "DONE" ]; then pm2 list | grep -E "saas|main"; fi
        `, (e, s) => {
            let out = '';
            s.on('data', d => { out += d; process.stdout.write(d.toString()); });
            s.on('close', () => {
                c.end();
                if ((out.includes('SAAS: DONE') && out.includes('MAIN: DONE')) || out.includes('FAIL') || tries >= 40) return;
                setTimeout(poll, 15000);
            });
        });
    }).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
};
setTimeout(poll, 20000);
