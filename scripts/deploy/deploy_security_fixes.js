const { Client } = require('ssh2');
const fs   = require('fs');
const path = require('path');

const HOST  = '46.4.188.170';
const PASS  = '_ee4SWbxLVfH9b';
const LOCAL = 'c:\\Users\\1\\Desktop\\alfa';

const NODES = [
    { name: 'n11', dir: '/www/wwwroot/n11.namainvist.com', pm2: 'n11' },
    { name: 'n1',  dir: '/www/wwwroot/n1.namainvist.com',  pm2: 'n1-main' },
    { name: 'n2',  dir: '/www/wwwroot/n2.namainvist.com',  pm2: 'n2' },
    { name: 'n3',  dir: '/www/wwwroot/n3.namainvist.com',  pm2: 'n3' },
    { name: 'n4',  dir: '/www/wwwroot/n4.namainvist.com',  pm2: 'n4' },
    { name: 'n5',  dir: '/www/wwwroot/n5.namainvist.com',  pm2: 'n5' },
    { name: 'n6',  dir: '/www/wwwroot/n6.namainvist.com',  pm2: 'n6' },
    { name: 'n7',  dir: '/www/wwwroot/n7.namainvist.com',  pm2: 'n7' },
    { name: 'n8',  dir: '/www/wwwroot/n8.namainvist.com',  pm2: 'n8' },
    { name: 'n9',  dir: '/www/wwwroot/n9.namainvist.com',  pm2: 'n9' },
    { name: 'n10', dir: '/www/wwwroot/n10.namainvist.com', pm2: 'n10' },
];

// ── الملفات المحدثة ──
const FILES = [
    // مكتبات جديدة
    'src/lib/api-error.ts',
    'src/lib/types.ts',
    // API routes المُصلحة (إزالة error.message + validation)
    'src/app/api/expenses/route.ts',
    'src/app/api/treasury/route.ts',
    'src/app/api/sales/route.ts',
    'src/app/api/purchases/route.ts',
    'src/app/api/purchase-returns/route.ts',
    'src/app/api/sales-returns/route.ts',
    'src/app/api/price-quotes/route.ts',
    'src/app/api/salaries/route.ts',
    'src/app/api/assets/route.ts',
    'src/app/api/fixed-assets/route.ts',
    'src/app/api/accounting/lc/route.ts',
    'src/app/api/assets/depreciate/route.ts',
    'src/app/api/banks/route.ts',
    'src/app/api/banks/[id]/route.ts',
    'src/app/api/banks/[id]/transactions/route.ts',
    'src/app/api/batches/route.ts',
    'src/app/api/batches/[id]/route.ts',
    'src/app/api/coupons/route.ts',
    'src/app/api/coupons/validate/route.ts',
    'src/app/api/coupons/[id]/route.ts',
    'src/app/api/enterprise/legal/route.ts',
    'src/app/api/enterprise/mrp/route.ts',
    'src/app/api/enterprise/projects/route.ts',
    'src/app/api/enterprise/projects/tasks/route.ts',
    'src/app/api/enterprise/wms/route.ts',
    'src/app/api/fixed-assets/[id]/depreciate/route.ts',
    'src/app/api/fixed-assets/[id]/route.ts',
    'src/app/api/gift-cards/route.ts',
    'src/app/api/gift-cards/[id]/route.ts',
    'src/app/api/hr/payroll/generate/route.ts',
    'src/app/api/manufacturing/orders/route.ts',
    'src/app/api/manufacturing/orders/[id]/route.ts',
    'src/app/api/manufacturing/recipes/route.ts',
    'src/app/api/manufacturing/recipes/[id]/route.ts',
    'src/app/api/pos/bnpl/route.ts',
    'src/app/api/pos/bnpl/status/route.ts',
    'src/app/api/sales-orders/route.ts',
    'src/app/api/sales-orders/[id]/process/route.ts',
    'src/app/api/settings/route.ts',
    'src/app/api/warehouses/analytics/route.ts',
];

const existingFiles = FILES.filter(f => fs.existsSync(path.join(LOCAL, f.replace(/\//g, '\\'))));
console.log(`\n🔒 نشر إصلاحات الأمان على N1-N11`);
console.log(`📦 ${existingFiles.length} ملف × ${NODES.length} نود`);
console.log('═'.repeat(55));

async function deployNode(node) {
    return new Promise((resolve) => {
        const conn = new Client();
        const log  = (m) => console.log(`[${node.name.toUpperCase()}] ${m}`);

        conn.on('error', (e) => { log(`❌ ${e.message}`); resolve({ node: node.name, ok: false }); });

        conn.on('ready', () => {
            conn.sftp(async (err, sftp) => {
                if (err) { conn.end(); return resolve({ node: node.name, ok: false }); }

                // إنشاء مجلدات lib إن لم تكن موجودة
                await new Promise(r => conn.exec(`mkdir -p "${node.dir}/src/lib"`, (e,s) => { s?.resume(); s?.on('close',r); if(e) r(null); }));

                let ok = 0;
                for (const f of existingFiles) {
                    const buf = fs.readFileSync(path.join(LOCAL, f.replace(/\//g, '\\')));
                    await new Promise(r => {
                        sftp.open(`${node.dir}/${f}`, 'w', (e, h) => {
                            if (e) return r(null);
                            sftp.write(h, buf, 0, buf.length, 0, (e2) => {
                                sftp.close(h, () => { if (!e2) ok++; r(null); });
                            });
                        });
                    });
                }
                sftp.end();
                log(`📤 ${ok}/${existingFiles.length} — بناء...`);

                await new Promise(r => {
                    conn.exec(`cd ${node.dir} && npm run build 2>&1 | tail -5 && pm2 restart ${node.pm2} 2>&1 | tail -2`, (e, s) => {
                        if (e) { log('build error'); return r(null); }
                        let out = '';
                        s.on('data', d => { out += d.toString(); });
                        s.stderr.on('data', d => { out += d.toString(); });
                        s.on('close', () => {
                            log(out.includes('online') || out.includes('Compiled') ? '🟢 جاهز!' : `⚠️ ${out.slice(-80)}`);
                            r(null);
                        });
                    });
                });

                conn.end();
                resolve({ node: node.name, ok: true, uploaded: ok });
            });
        });

        conn.connect({ host: HOST, port: 22, username: 'root', password: PASS, readyTimeout: 25000 });
    });
}

async function main() {
    const BATCH = 3;
    const results = [];
    for (let i = 0; i < NODES.length; i += BATCH) {
        const batch = NODES.slice(i, i + BATCH);
        console.log(`\n⚡ ${batch.map(n => n.name.toUpperCase()).join(' + ')}`);
        results.push(...await Promise.all(batch.map(deployNode)));
    }
    console.log('\n' + '═'.repeat(55));
    results.forEach(r => console.log(`  ${r.ok ? '✅' : '❌'} ${r.node.toUpperCase()}`));
    console.log(`\n🔒 ${results.filter(r=>r.ok).length}/${NODES.length} نود مؤمَّن`);
}

main().catch(console.error);
