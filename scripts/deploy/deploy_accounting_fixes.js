const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

console.log('🔄 Uploading all accounting hotfix files...');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;

        const files = [
            { l: 'c:\\Users\\1\\Desktop\\alfa\\src\\lib\\auto-journal.ts', r: '/www/wwwroot/n11.namainvist.com/src/lib/auto-journal.ts' },
            { l: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\hr\\payroll\\generate\\route.ts', r: '/www/wwwroot/n11.namainvist.com/src/app/api/hr/payroll/generate/route.ts' },
            { l: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\purchase-returns\\route.ts', r: '/www/wwwroot/n11.namainvist.com/src/app/api/purchase-returns/route.ts' },
            { l: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\stock\\adjustments\\route.ts', r: '/www/wwwroot/n11.namainvist.com/src/app/api/stock/adjustments/route.ts' },
            { l: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\purchases\\grn\\route.ts', r: '/www/wwwroot/n11.namainvist.com/src/app/api/purchases/grn/route.ts' },
            { l: 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api\\bookings\\invoice\\route.ts', r: '/www/wwwroot/n11.namainvist.com/src/app/api/bookings/invoice/route.ts' }
        ];

        let completed = 0;
        files.forEach(f => {
            sftp.fastPut(f.l, f.r, (err) => {
                if (err) {
                    console.error('❌ Failed to upload', f.l, err);
                } else {
                    console.log('✅ Uploaded', f.l);
                }
                completed++;
                if (completed === files.length) {
                    console.log('✅ All files uploaded. Proceeding to build...');
                    conn.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11', (err, stream) => {
                        if (err) throw err;
                        stream.on('close', () => {
                            console.log('🎉 Remote build and restart finished.');
                            conn.end();
                        }).on('data', d => process.stdout.write(d.toString()))
                          .stderr.on('data', d => process.stderr.write(d.toString()));
                    });
                }
            });
        });
    });
}).on('error', console.error).connect(config);
