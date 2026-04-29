const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const APP = '/www/wwwroot/n11.namainvist.com';

const files = [
    'src/app/restaurant-pos/page.tsx',
    'src/app/pos/page.tsx',
    'src/app/api/pos/restaurant/floor/route.ts',
    'src/app/api/pos/pending-orders/route.ts',
    'src/app/api/public/menu/route.ts',
    'src/app/api/public/order/route.ts',
    'src/app/api/public/table/route.ts',
    'src/app/api/public/call-waiter/route.ts',
    'src/app/menu/[tableId]/page.tsx',
    'src/app/layout.tsx',
    'src/middleware.ts',
    'src/hooks/useFeatureFlag.tsx',
    'src/hooks/FeatureGuard.tsx',
    'src/components/PosReturnsModal.tsx',
    'src/components/InvoiceReceipt.tsx',
];

conn.on('ready', () => {
    console.log('✅ رفع التحديث النهائي...');
    const dirs = [...new Set(files.map(f => path.posix.dirname(f)))];
    conn.exec(dirs.map(d => `mkdir -p "${APP}/${d}"`).join(' && '), (err, stream) => {
        if (err) throw err;
        stream.resume();
        stream.on('close', () => {
            conn.sftp((err, sftp) => {
                if (err) throw err;
                let done = 0, up = 0;
                files.forEach(f => {
                    const lp = path.join(__dirname, f);
                    if (!fs.existsSync(lp)) { console.log(`⚠️ ${f}`); done++; if (done === files.length) build(); return; }
                    sftp.fastPut(lp, `${APP}/${f}`, (err) => {
                        if (err) console.log(`❌ ${f}: ${err.message}`);
                        else { console.log(`📤 ${f}`); up++; }
                        done++;
                        if (done === files.length) build();
                    });
                });
                function build() {
                    console.log(`\n✅ ${up} ملف. ⏳ بناء...`);
                    conn.exec(`cd ${APP} && npm run build 2>&1 | tail -15 && pm2 restart saas-app && echo "✅ DONE"`, (e, s) => {
                        s.on('data', d => process.stdout.write(d.toString()));
                        s.stderr.on('data', d => process.stderr.write(d.toString()));
                        s.on('close', () => conn.end());
                    });
                }
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
