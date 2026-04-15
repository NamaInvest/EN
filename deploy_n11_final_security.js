const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 };
const basePath = '/www/wwwroot/n11.namainvist.com/';

const filesToUpload = [
    // Security files (previously deployed, re-upload to ensure latest)
    'src/lib/validations.ts',
    'src/lib/api-handler.ts',
    'src/app/api/purchases/route.ts',
    'src/app/api/purchase-returns/route.ts',
    'src/app/api/sales-returns/route.ts',
    'src/app/api/salaries/route.ts',
    'src/app/api/treasury/balance/route.ts',
    // Phase 4: Query optimization
    'src/app/api/vacations/route.ts',
    'src/app/api/sales/targets/route.ts',
    'src/app/api/hr/loans/route.ts',
    'src/app/api/finance/petty-cash/route.ts',
    'src/app/api/attendance/route.ts',
    'src/app/api/reports/[type]/route.ts',
    'src/app/api/purchase-orders/route.ts',
    'src/app/api/installments/route.ts',
    'src/app/api/bookings/invoice/route.ts',
    'src/app/api/sales-orders/route.ts',
    'src/app/api/ai-auditor/route.ts',
    'src/app/api/cron/trigger-invoices/route.ts',
];

console.log(`🔄 رفع ${filesToUpload.length} ملف إلى N11 (الدفعة النهائية)...`);
const conn = new Client();
conn.on('ready', () => {
    console.log('✅ تم الاتصال!');

    // Ensure all directories exist
    const dirs = [...new Set(filesToUpload.map(f => path.dirname(f).replace(/\\/g, '/')))];
    const mkdirCmd = dirs.map(d => `mkdir -p ${basePath}${d}`).join(' && ');

    conn.exec(mkdirCmd, (err, stream) => {
        stream.on('close', () => {
            conn.sftp((err, sftp) => {
                let uploaded = 0;
                let failed = 0;
                filesToUpload.forEach(relPath => {
                    const localFile = path.join(__dirname, relPath);
                    const remoteFile = basePath + relPath.replace(/\\/g, '/');
                    sftp.fastPut(localFile, remoteFile, (err) => {
                        if (err) {
                            console.error(`❌ فشل: ${relPath} - ${err.message}`);
                            failed++;
                        } else {
                            console.log(`✅ ${relPath}`);
                        }
                        uploaded++;
                        if (uploaded === filesToUpload.length) {
                            if (failed > 0) console.warn(`⚠️  ${failed} ملف فشل رفعه`);
                            console.log('\n⏳ جاري البناء وإعادة التشغيل...');
                            conn.exec(`cd ${basePath} && npm run build 2>&1 | tail -30 && pm2 restart n11 && echo "🚀 DONE"`, (err, stream) => {
                                stream.on('close', () => { console.log('✅ اكتملت العملية!'); conn.end(); })
                                    .on('data', d => process.stdout.write(d.toString()))
                                    .stderr.on('data', d => process.stderr.write(d.toString()));
                            });
                        }
                    });
                });
            });
        });
    });
}).connect(config);
