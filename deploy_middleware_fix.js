const { Client } = require('ssh2');
const c = new Client();
c.on('ready', () => {
    c.sftp((e, sftp) => {
        if (e) throw e;
        sftp.fastPut(
            'd:/namasoft9-3-main/src/middleware.ts',
            '/www/wwwroot/namainvist.com/src/middleware.ts',
            {},
            (err) => {
                if (err) { console.error('Upload failed:', err.message); c.end(); return; }
                console.log('✅ middleware.ts uploaded');
                c.exec('cd /www/wwwroot/namainvist.com && npm run build > /tmp/ice_mw_build.log 2>&1 && pm2 restart main-site && echo BUILD_OK || echo BUILD_FAIL', (e2, s) => {
                    s.on('data', d => process.stdout.write(d.toString()));
                    s.on('close', () => {
                        console.log('\n⏳ Waiting 10s for startup...');
                        setTimeout(() => {
                            // Test API after restart
                            c.exec([
                                "curl -s -X POST http://127.0.0.1:3000/api/ice/toggle -H 'Content-Type: application/json' -d '{\"subdomain\":\"test\"}' | head -100",
                                "echo ''",
                                "curl -s http://127.0.0.1:3000/api/ice/tenants | head -100",
                            ].join(' && '), (e3, s3) => {
                                let out = '';
                                s3.on('data', d => { out += d.toString(); });
                                s3.on('close', () => {
                                    console.log('\n=== API Response Test ===');
                                    console.log(out);
                                    c.end();
                                });
                            });
                        }, 10000);
                    });
                });
            }
        );
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
