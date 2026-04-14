const { Client } = require('ssh2');
const fs   = require('fs');
const path = require('path');

const HOST  = '46.4.188.170';
const USER  = 'root';
const PASS  = '_ee4SWbxLVfH9b';
const RDIR  = '/www/wwwroot/n11.namainvist.com';
const PM2   = 'n11';
const LOCAL = 'd:\\namasoft9-3-main';

// ── الملفات المحدثة ──
const newFiles = [
    // 1. APIs مفقودة (جديدة)
    'src/app/api/hr/employees/route.ts',
    'src/app/api/accounts/route.ts',

    // 2. نظام Toast الجديد
    'src/components/Toast.tsx',

    // 3. Dashboard layout المحدث
    'src/app/(dashboard)/layout.tsx',

    // 4. الصفحات المُصلحة (إزالة الأخطاء الصامتة)
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
    'src/app/(dashboard)/manufacturing/page.tsx',
    'src/app/(dashboard)/maintenance/page.tsx',
    'src/app/(dashboard)/treasury/page.tsx',
    'src/app/(dashboard)/hr/employees/page.tsx',
    'src/app/(dashboard)/hr/attendance/page.tsx',
    'src/app/(dashboard)/hr/salaries/page.tsx',
    'src/app/(dashboard)/hr/vacations/page.tsx',
    'src/app/(dashboard)/enterprise/legal/page.tsx',
    'src/app/(dashboard)/enterprise/mrp/page.tsx',
    'src/app/(dashboard)/enterprise/projects/page.tsx',
    'src/app/(dashboard)/enterprise/wms/page.tsx',
    'src/app/(dashboard)/sales/routes/page.tsx',
    'src/app/(dashboard)/sales/targets/page.tsx',
    'src/app/(dashboard)/company-info/page.tsx',
    'src/app/(dashboard)/dashboard/page.tsx',
    'src/app/(dashboard)/batches/page.tsx',
    'src/app/(dashboard)/fixed-assets/page.tsx',
    'src/app/(dashboard)/gift-cards/page.tsx',
    'src/app/(dashboard)/audit-logs/page.tsx',
    'src/app/(dashboard)/recurring-invoices/page.tsx',
];

// فقط الملفات الموجودة محلياً
const existingFiles = newFiles.filter(f => fs.existsSync(path.join(LOCAL, f.replace(/\//g, '\\'))));
console.log(`📦 إجمالي الملفات للنشر: ${existingFiles.length}`);

const conn = new Client();
conn.on('ready', async () => {
    console.log('✅ متصل بـ N11\n');
    conn.sftp(async (err, sftp) => {
        if (err) throw err;

        // ── إنشاء المجلدات الجديدة أولاً ──
        const newDirs = [
            `${RDIR}/src/app/api/hr/employees`,
            `${RDIR}/src/app/api/accounts`,
        ];
        for (const d of newDirs) {
            await new Promise(res =>
                conn.exec(`mkdir -p "${d}"`, (e, s) => { s?.resume(); s?.on('close', res); if (e) res(e); })
            );
        }

        // ── رفع الملفات ──
        let uploaded = 0;
        for (const f of existingFiles) {
            const localPath  = path.join(LOCAL, f.replace(/\//g, '\\'));
            const remotePath = `${RDIR}/${f}`;
            const buf = fs.readFileSync(localPath);
            
            await new Promise((res, rej) => {
                sftp.open(remotePath, 'w', (e, h) => {
                    if (e) { console.log(`⚠️  فشل فتح ${f}: ${e.message}`); return res(null); }
                    sftp.write(h, buf, 0, buf.length, 0, (e2) => {
                        if (e2) { console.log(`⚠️  فشل كتابة ${f}`); sftp.close(h, () => res(null)); return; }
                        sftp.close(h, () => { uploaded++; process.stdout.write(`\r📤 ${uploaded}/${existingFiles.length} ملف`); res(null); });
                    });
                });
            });
        }
        sftp.end();
        console.log(`\n\n✅ تم رفع ${uploaded} ملف\n`);

        // ── بناء وإعادة تشغيل ──
        console.log('🔨 npm run build...');
        await new Promise((res, rej) => {
            conn.exec(`cd ${RDIR} && npm run build 2>&1 | tail -12 && pm2 restart ${PM2}`, (e, s) => {
                if (e) return rej(e);
                s.on('data', d => process.stdout.write(d));
                s.stderr.on('data', d => process.stdout.write(d));
                s.on('close', res);
            });
        });

        console.log('\n🎉 تم! إصلاح الأزرار نُشر على N11 بنجاح');
        conn.end();
    });
}).connect({ host: HOST, port: 22, username: USER, password: PASS, readyTimeout: 20000 });
