const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const files = [
            // middleware → both sites
            ['c:/Users/1/Desktop/alfa/src/middleware.ts', '/www/wwwroot/namainvist.com/src/middleware.ts', 'main-site middleware'],
            ['c:/Users/1/Desktop/alfa/src/middleware.ts', '/www/wwwroot/n11.namainvist.com/src/middleware.ts', 'saas-app middleware'],
            // check-status → saas-app only (main-site will call saas-app internally)
            ['c:/Users/1/Desktop/alfa/src/app/api/tenant/check-status/route.ts', '/www/wwwroot/n11.namainvist.com/src/app/api/tenant/check-status/route.ts', 'saas-app check-status'],
        ];
        
        let done = 0;
        files.forEach(([local, remote, label]) => {
            sftp.fastPut(local, remote, {}, putErr => {
                if (putErr) console.error(`❌ ${label}: ${putErr.message}`);
                else console.log(`✅ ${label}`);
                done++;
                if (done === files.length) {
                    // Rebuild main-site (only middleware changed)
                    console.log('\n🔨 Building main-site...');
                    conn.exec(
                        'cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart main-site --update-env && echo "✅ main-site OK"',
                        (e, s) => {
                            s.on('data', d => process.stdout.write(d.toString()));
                            s.on('close', () => {
                                // Rebuild saas-app
                                console.log('\n🔨 Building saas-app...');
                                conn.exec(
                                    'cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart saas-app && sleep 6 && echo "=== TEST ===" && curl -s "http://127.0.0.1:3500/api/tenant/check-status?userId=user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs" && echo "" && curl -s "http://127.0.0.1:3000/api/tenant/check-status?userId=user_3CVlTU5PDDyb3Ofw8aJFXYOuNFs"',
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
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
