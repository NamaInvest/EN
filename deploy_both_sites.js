const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        let done = 0;
        const paths = [
            [
                'd:/namasoft9-3-main/src/app/api/tenant/check-status/route.ts',
                '/www/wwwroot/namainvist.com/src/app/api/tenant/check-status/route.ts'
            ],
            [
                'd:/namasoft9-3-main/src/app/api/tenant/check-status/route.ts',
                '/www/wwwroot/n11.namainvist.com/src/app/api/tenant/check-status/route.ts'
            ],
        ];

        paths.forEach(([local, remote]) => {
            sftp.fastPut(local, remote, {}, putErr => {
                if (putErr) console.error(`❌ ${remote}: ${putErr.message}`);
                else console.log(`✅ Uploaded: ${remote.split('/').pop()} -> ${remote.includes('namainvist.com/src') && !remote.includes('n11') ? 'main-site' : 'saas-app'}`);
                done++;
                if (done === paths.length) {
                    console.log('\n🔨 Building both sites simultaneously...');
                    
                    // Build main-site
                    conn.exec(
                        'cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart main-site --update-env && echo "✅ main-site done"',
                        (e, s) => {
                            s.on('data', d => process.stdout.write(d.toString()));
                            s.stderr.on('data', d => process.stderr.write(d.toString()));
                            s.on('close', () => {
                                // Build saas-app
                                conn.exec(
                                    'cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart saas-app && sleep 5 && echo "" && echo "=== FINAL CHECK ===" && curl -s "http://127.0.0.1:3000/api/tenant/check-status?userId=user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs" && echo "" && curl -s "http://127.0.0.1:3500/api/tenant/check-status?userId=user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs"',
                                    (e2, s2) => {
                                        s2.on('data', d => process.stdout.write(d.toString()));
                                        s2.stderr.on('data', d => process.stderr.write(d.toString()));
                                        s2.on('close', () => conn.end());
                                    }
                                );
                            });
                        }
                    );
                }
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
