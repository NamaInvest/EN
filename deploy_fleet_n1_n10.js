/**
 * deploy_fleet_n1_n10.js
 * ينشر إصلاحات الأزرار من N11 إلى N1-N10 بالتوازي
 * كل نود: رفع الملفات → npm run build → pm2 restart
 */

const { Client } = require('ssh2');
const fs   = require('fs');
const path = require('path');

// ── إعدادات الاتصال ──
const HOST = '46.4.188.170';
const PASS = '_ee4SWbxLVfH9b';
const LOCAL = 'd:\\namasoft9-3-main';

// ── خريطة النودات ──
const NODES = [
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

// ── الملفات المحدثة (نفس ما نُشر على N11) ──
const FILES = [
    // APIs مفقودة
    'src/app/api/hr/employees/route.ts',
    'src/app/api/accounts/route.ts',
    // نظام Toast
    'src/components/Toast.tsx',
    // Dashboard layout
    'src/app/(dashboard)/layout.tsx',
    // ثيم أبيض
    'src/app/globals.css',
    'src/app/layout.tsx',
    'src/components/ThemeSwitcher.tsx',
    // عروض الأسعار
    'src/app/(dashboard)/price-quotes/page.tsx',
    // صفحات مُصلحة
    'src/app/(dashboard)/customers/page.tsx',
    'src/app/(dashboard)/products/page.tsx',
    'src/app/(dashboard)/expenses/page.tsx',
    'src/app/(dashboard)/treasury/page.tsx',
    'src/app/(dashboard)/purchases/page.tsx',
    'src/app/(dashboard)/sales/page.tsx',
    'src/app/(dashboard)/accounting/page.tsx',
    'src/app/(dashboard)/employees/page.tsx',
    'src/app/(dashboard)/settings/page.tsx',
    'src/app/(dashboard)/branches/page.tsx',
    'src/app/(dashboard)/reports/page.tsx',
    'src/app/(dashboard)/stock/page.tsx',
    'src/app/(dashboard)/stocktake/page.tsx',
    'src/app/(dashboard)/stock-transfers/page.tsx',
    'src/app/(dashboard)/purchase-orders/page.tsx',
    'src/app/(dashboard)/purchase-returns/page.tsx',
    'src/app/(dashboard)/sales-returns/page.tsx',
    'src/app/(dashboard)/promotions/page.tsx',
    'src/app/(dashboard)/coupons/page.tsx',
    'src/app/(dashboard)/loyalty/page.tsx',
    'src/app/(dashboard)/maintenance/page.tsx',
    'src/app/(dashboard)/company-info/page.tsx',
    'src/app/(dashboard)/dashboard/page.tsx',
    'src/app/(dashboard)/batches/page.tsx',
    'src/app/(dashboard)/fixed-assets/page.tsx',
    'src/app/(dashboard)/gift-cards/page.tsx',
    'src/app/(dashboard)/audit-logs/page.tsx',
    'src/app/(dashboard)/recurring-invoices/page.tsx',
    'src/app/(dashboard)/sales/routes/page.tsx',
    'src/app/(dashboard)/sales/targets/page.tsx',
    'src/app/(dashboard)/enterprise/legal/page.tsx',
    'src/app/(dashboard)/enterprise/mrp/page.tsx',
    'src/app/(dashboard)/enterprise/projects/page.tsx',
    'src/app/(dashboard)/enterprise/wms/page.tsx',
];

// فلتر الملفات الموجودة محلياً فقط
const existingFiles = FILES.filter(f => {
    const localPath = path.join(LOCAL, f.replace(/\//g, '\\'));
    return fs.existsSync(localPath);
});

console.log(`\n🚀 نشر إصلاحات الأزرار على N1 → N10`);
console.log(`📦 ${existingFiles.length} ملف × ${NODES.length} نود = ${existingFiles.length * NODES.length} عملية رفع`);
console.log('═'.repeat(60));

// ── دالة نشر نود واحد ──
async function deployNode(node) {
    return new Promise((resolve) => {
        const conn = new Client();
        const log  = (msg) => console.log(`[${node.name.toUpperCase()}] ${msg}`);

        conn.on('error', (err) => {
            log(`❌ خطأ في الاتصال: ${err.message}`);
            resolve({ node: node.name, success: false, error: err.message });
        });

        conn.on('ready', () => {
            conn.sftp(async (err, sftp) => {
                if (err) {
                    log(`❌ SFTP error: ${err.message}`);
                    conn.end();
                    return resolve({ node: node.name, success: false });
                }

                // ── 1. إنشاء المجلدات الجديدة ──
                const newDirs = [
                    `${node.dir}/src/app/api/hr/employees`,
                    `${node.dir}/src/app/api/accounts`,
                ];
                for (const d of newDirs) {
                    await new Promise(r =>
                        conn.exec(`mkdir -p "${d}"`, (e, s) => { s?.resume(); s?.on('close', r); if (e) r(e); })
                    );
                }

                // ── 2. رفع الملفات ──
                let uploaded = 0;
                for (const f of existingFiles) {
                    const localPath  = path.join(LOCAL, f.replace(/\//g, '\\'));
                    const remotePath = `${node.dir}/${f}`;
                    const buf = fs.readFileSync(localPath);

                    await new Promise((res) => {
                        sftp.open(remotePath, 'w', (e, h) => {
                            if (e) return res(null); // تجاهل الملفات المفقودة
                            sftp.write(h, buf, 0, buf.length, 0, (e2) => {
                                sftp.close(h, () => { if (!e2) uploaded++; res(null); });
                            });
                        });
                    });
                }
                sftp.end();
                log(`✅ رُفع ${uploaded}/${existingFiles.length} ملف`);

                // ── 3. بناء وإعادة تشغيل ──
                log(`🔨 npm run build...`);
                await new Promise((res) => {
                    conn.exec(`cd ${node.dir} && npm run build 2>&1 | tail -5 && pm2 restart ${node.pm2} 2>&1 | tail -3`, (e, s) => {
                        if (e) { log(`⚠️  Build error: ${e.message}`); return res(null); }
                        let out = '';
                        s.on('data', d => { out += d; });
                        s.stderr.on('data', d => { out += d; });
                        s.on('close', () => {
                            const ok = out.includes('online') || out.includes('successfully');
                            log(ok ? `🟢 جاهز!` : `⚠️  ${out.slice(-100)}`);
                            res(null);
                        });
                    });
                });

                conn.end();
                resolve({ node: node.name, success: true, uploaded });
            });
        });

        conn.connect({
            host: HOST,
            port: 22,
            username: 'root',
            password: PASS,
            readyTimeout: 30000,
        });
    });
}

// ── تشغيل كل النودات بالتوازي (مجموعات من 3) ──
async function main() {
    const start   = Date.now();
    const results = [];
    const BATCH   = 3; // 3 نودات في نفس الوقت

    for (let i = 0; i < NODES.length; i += BATCH) {
        const batch = NODES.slice(i, i + BATCH);
        console.log(`\n⚡ تشغيل المجموعة: ${batch.map(n => n.name).join(', ')}`);
        const batchResults = await Promise.all(batch.map(deployNode));
        results.push(...batchResults);
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(0);
    console.log('\n' + '═'.repeat(60));
    console.log(`\n📊 النتائج النهائية (${elapsed} ثانية):\n`);

    let success = 0, failed = 0;
    for (const r of results) {
        if (r.success) {
            console.log(`  ✅ ${r.node.toUpperCase()} — ${r.uploaded} ملف`);
            success++;
        } else {
            console.log(`  ❌ ${r.node.toUpperCase()} — فشل`);
            failed++;
        }
    }

    console.log(`\n🎉 ${success}/${NODES.length} نود مكتمل | ${failed} فشل`);
}

main().catch(console.error);
