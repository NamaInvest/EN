/**
 * Deploy G-series (Gap Builds) to production
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
const LOCAL = 'd:\\namasoft9-3-main';
const FILES = [
    "src/components/Sidebar.tsx",
    "src/lib/number-sequence-engine.ts",
    "src/lib/bank-reconciliation-ui-engine.ts",
    "src/lib/aging-engine.ts",
    "src/lib/delivery-note-engine.ts",
    "src/lib/commission-engine.ts",
    "src/app/api/banks/reconciliation/route.ts",
    "src/app/api/reports/aging/route.ts",
    "src/app/api/shipments/delivery-notes/route.ts",
    "src/app/api/sales/commissions/route.ts",
];

function upload(sftp,l,r){return new Promise((ok,no)=>{sftp.writeFile(r,fs.readFileSync(l),e=>e?no(e):ok())})}
function exec(c,cmd){return new Promise((ok,no)=>{c.exec(cmd,(e,s)=>{if(e)return no(e);let o='';s.on('data',d=>{o+=d;process.stdout.write(d.toString())});s.stderr.on('data',d=>process.stderr.write(d.toString()));s.on('close',()=>ok(o))})})}
function mkd(sftp,d){return new Promise(ok=>sftp.mkdir(d,()=>ok()))}

async function run(){
    const conn = new Client();
    console.log(`🚀 G-SERIES DEPLOY — ${FILES.length} files`);
    conn.on('ready', async()=>{
        console.log('✅ Connected\n');
        const sftp = await new Promise((ok,no)=>conn.sftp((e,s)=>e?no(e):ok(s)));
        for(const t of TARGETS){
            console.log(`📦 ${t.base}`);
            const dirs=new Set();
            for(const f of FILES){let c=t.base;f.split('/').slice(0,-1).forEach(p=>{c+='/'+p;dirs.add(c)})}
            for(const d of [...dirs].sort()) await mkd(sftp,d);
            let ok=0;
            for(const f of FILES){
                const lp=path.join(LOCAL,f.replace(/\//g,'\\'));
                if(!fs.existsSync(lp)){console.log(`  ⚠️ SKIP ${f}`);continue}
                try{await upload(sftp,lp,`${t.base}/${f}`);ok++;console.log(`  ✅ ${f}`)}catch(e){console.log(`  ❌ ${f}`)}
            }
            console.log(`  📊 ${ok}/${FILES.length}\n`);
        }
        for(const t of TARGETS){
            console.log(`🏗️ Build ${t.pm2}...`);
            await exec(conn,`cd ${t.base} && rm -rf .next && npm run build 2>&1 | tail -5`);
            await exec(conn,`pm2 restart ${t.pm2}`);
            console.log(`✅ ${t.pm2} done\n`);
        }
        console.log('🎉 G-SERIES DEPLOYED!');
        conn.end();
    });
    conn.on('error',e=>console.error('❌',e.message));
    conn.connect(SERVER);
}
run();
