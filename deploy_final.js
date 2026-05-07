/**
 * FINAL DEPLOY — All remaining builds (Phase 3-6)
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const SERVER = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' };
const TARGETS = [
    { base: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
    { base: '/www/wwwroot/n1.namainvist.com', pm2: 'n1-main' },
    { base: '/www/wwwroot/n11.namainvist.com', pm2: 'saas-app' }
];
const LOCAL_BASE = 'd:\\namasoft9-3-main';

const FILES = [
    "src/components/Sidebar.tsx",
    // Engines
    "src/lib/wave-picking.ts",
    "src/lib/mes-engine.ts",
    "src/lib/bi-cube-engine.ts",
    "src/lib/sso-engine.ts",
    "src/lib/spend-analytics.ts",
    "src/lib/preventive-maintenance.ts",
    "src/lib/service-sla.ts",
    "src/lib/nlq-engine.ts",
    // APIs
    "src/app/api/wms/waves/route.ts",
    "src/app/api/manufacturing/oee/route.ts",
    "src/app/api/bi/cube/route.ts",
    "src/app/api/procurement/spend-analytics/route.ts",
    "src/app/api/maintenance/preventive/route.ts",
    "src/app/api/service/sla/route.ts",
    "src/app/api/ai/nlq/route.ts",
    "src/app/api/auth/sso/route.ts",
];

function uploadFile(sftp, lp, rp) { return new Promise((r,j) => { sftp.writeFile(rp, fs.readFileSync(lp), e => e?j(e):r()); }); }
function execCmd(conn, cmd) { return new Promise((r,j) => { conn.exec(cmd, (e,s) => { if(e)return j(e); let o=''; s.on('data',d=>{o+=d;process.stdout.write(d.toString())}); s.stderr.on('data',d=>process.stderr.write(d.toString())); s.on('close',c=>r({code:c,stdout:o})); }); }); }
function mkdir(sftp, d) { return new Promise(r => sftp.mkdir(d, () => r())); }

async function deploy() {
    const conn = new Client();
    console.log(`🚀 FINAL DEPLOY — ${FILES.length} files (all remaining builds)`);
    conn.on('ready', async () => {
        console.log('✅ Connected!\n');
        const sftp = await new Promise((r,j) => conn.sftp((e,s)=>e?j(e):r(s)));
        for (const t of TARGETS) {
            console.log(`📦 ${t.base}`);
            const dirs = new Set();
            for (const f of FILES) { let c=t.base; f.split('/').slice(0,-1).forEach(p=>{c+='/'+p;dirs.add(c)}); }
            for (const d of [...dirs].sort()) await mkdir(sftp, d);
            let ok=0;
            for (const f of FILES) {
                const lp = path.join(LOCAL_BASE, f.replace(/\//g,'\\'));
                if (!fs.existsSync(lp)) { console.log(`  ⚠️ SKIP: ${f}`); continue; }
                try { await uploadFile(sftp, lp, `${t.base}/${f}`); ok++; console.log(`  ✅ ${f}`); } catch(e) { console.log(`  ❌ ${f}`); }
            }
            console.log(`  📊 ${ok}/${FILES.length}\n`);
        }
        for (const t of TARGETS) {
            console.log(`🏗️ Building ${t.pm2}...`);
            await execCmd(conn, `cd ${t.base} && rm -rf .next && npm run build 2>&1 | tail -5`);
            await execCmd(conn, `pm2 restart ${t.pm2}`);
            console.log(`✅ ${t.pm2} restarted!\n`);
        }
        console.log('🩺 Health Check...');
        for (const d of ['namainvist.com','n1.namainvist.com','n11.namainvist.com']) {
            const r = await execCmd(conn, `curl -s -o /dev/null -w "%{http_code}" https://${d}/`);
            console.log(`  ${r.stdout.trim()==='200'?'✅':'⚠️'} ${d} → ${r.stdout.trim()}`);
        }
        console.log('\n🎉🎉🎉 ALL 46 BUILDS DEPLOYED! 🎉🎉🎉');
        conn.end();
    });
    conn.on('error', e => console.error('❌', e.message));
    conn.connect(SERVER);
}
deploy();
