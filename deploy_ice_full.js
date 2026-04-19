/**
 * deploy_ice_full.js — Comprehensive ICE Panel deploy v2
 * Creates directories + uploads ALL files
 */
const { Client } = require('ssh2');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const MAIN = '/www/wwwroot/namainvist.com';
const SAAS = '/www/wwwroot/n11.namainvist.com';
const LOCAL = 'd:/namasoft9-3-main';

const FILES = [
    [`${LOCAL}/src/middleware.ts`, `${MAIN}/src/middleware.ts`, 'middleware (main)'],
    [`${LOCAL}/src/app/ice/page.tsx`, `${MAIN}/src/app/ice/page.tsx`, 'ice/page (main)'],
    [`${LOCAL}/src/app/ice/page.tsx`, `${SAAS}/src/app/ice/page.tsx`, 'ice/page (saas)'],
    [`${LOCAL}/src/components/Sidebar.tsx`, `${MAIN}/src/components/Sidebar.tsx`, 'Sidebar (main)'],
    [`${LOCAL}/src/components/Sidebar.tsx`, `${SAAS}/src/components/Sidebar.tsx`, 'Sidebar (saas)'],
    [`${LOCAL}/src/app/api/ice/toggle/route.ts`, `${MAIN}/src/app/api/ice/toggle/route.ts`, 'api/ice/toggle (main)'],
    [`${LOCAL}/src/app/api/ice/tenants/route.ts`, `${MAIN}/src/app/api/ice/tenants/route.ts`, 'api/ice/tenants (main)'],
    [`${LOCAL}/src/app/api/tenant/hidden-modules/route.ts`, `${MAIN}/src/app/api/tenant/hidden-modules/route.ts`, 'hidden-modules (main)'],
    [`${LOCAL}/src/app/api/tenant/hidden-modules/route.ts`, `${SAAS}/src/app/api/tenant/hidden-modules/route.ts`, 'hidden-modules (saas)'],
];

console.log('🚀 ICE Full Deploy v2 — Step 1: Creating directories, Step 2: Uploading files\n');

const conn = new Client();
conn.on('ready', () => {
    // Step 1: Create all required directories on server
    const dirs = [
        `${MAIN}/src/app/api/ice/toggle`,
        `${MAIN}/src/app/api/ice/tenants`,
        `${MAIN}/src/app/api/tenant/hidden-modules`,
        `${SAAS}/src/app/api/tenant/hidden-modules`,
    ];
    const mkdirCmd = dirs.map(d => `mkdir -p ${d}`).join(' && ');

    conn.exec(mkdirCmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('📁 Directories created\n');

            // Step 2: Upload files
            conn.sftp((e, sftp) => {
                if (e) throw e;
                const upload = (local, remote, label) => new Promise((res, rej) =>
                    sftp.fastPut(local, remote, {}, err => {
                        if (err) { console.error(`  ❌ ${label}: ${err.message}`); rej(err); }
                        else { console.log(`  ✅ ${label}`); res(); }
                    })
                );

                const run = async () => {
                    for (const [local, remote, label] of FILES) {
                        await upload(local, remote, label);
                    }

                    console.log('\n🔨 Building both apps (this takes ~2 minutes)...\n');
                    conn.exec(`
rm -f /tmp/ice_full_main.flag /tmp/ice_full_saas.flag
nohup bash -c 'cd ${MAIN} && npm run build > /tmp/ice_full_main.log 2>&1 && pm2 restart main-site && touch /tmp/ice_full_main.flag' &
nohup bash -c 'cd ${SAAS} && npm run build > /tmp/ice_full_saas.log 2>&1 && pm2 restart saas-app && touch /tmp/ice_full_saas.flag' &
echo "Build processes started"
                    `, (e3, s3) => {
                        s3.on('data', d => process.stdout.write(d.toString()));
                        s3.on('close', () => { console.log('\n⏳ Polling for completion...\n'); conn.end(); });
                    });
                };
                run().catch(e => { console.error('Upload error:', e.message); conn.end(); });
            });
        });
    });
}).connect(SERVER);

// Poll
let tries = 0;
const poll = () => {
    tries++;
    const c = new Client();
    c.on('ready', () => {
        c.exec(`
m=$([ -f /tmp/ice_full_main.flag ] && echo "DONE" || echo "Building...")
s=$([ -f /tmp/ice_full_saas.flag ] && echo "DONE" || echo "Building...")
echo "MAIN: $m | SAAS: $s (${tries * 15}s)"
if [ "$m" = "DONE" ] && [ "$s" = "DONE" ]; then
    pm2 list | grep -E "main|saas"
    echo ""
    echo "=== VERIFY: middleware has api/ice ==="
    grep -c "api/ice" ${MAIN}/src/middleware.ts 2>/dev/null && echo "middleware: OK" || echo "middleware: MISSING"
    echo "=== VERIFY: Sidebar has SUBMODULE_MAP ==="
    grep -c "SUBMODULE_MAP" ${SAAS}/src/components/Sidebar.tsx 2>/dev/null && echo "Sidebar: OK" || echo "Sidebar: MISSING"
fi
        `, (e, s) => {
            let out = '';
            s.on('data', d => { out += d; process.stdout.write(d.toString()); });
            s.on('close', () => {
                c.end();
                if ((out.includes('MAIN: DONE') && out.includes('SAAS: DONE')) || tries >= 40) {
                    console.log('\n✅ Full deployment complete!');
                    return;
                }
                setTimeout(poll, 15000);
            });
        });
    }).connect(SERVER);
};
setTimeout(poll, 25000);
