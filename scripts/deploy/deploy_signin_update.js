const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const files = [
            // middleware - both sites
            ['c:/Users/1/Desktop/alfa/src/middleware.ts', '/www/wwwroot/namainvist.com/src/middleware.ts', 'main middleware'],
            ['c:/Users/1/Desktop/alfa/src/middleware.ts', '/www/wwwroot/n11.namainvist.com/src/middleware.ts', 'saas middleware'],
            // sign-in page - both sites
            ['c:/Users/1/Desktop/alfa/src/app/sign-in/[[...sign-in]]/page.tsx', '/www/wwwroot/namainvist.com/src/app/sign-in/[[...sign-in]]/page.tsx', 'main sign-in'],
            ['c:/Users/1/Desktop/alfa/src/app/sign-in/[[...sign-in]]/page.tsx', '/www/wwwroot/n11.namainvist.com/src/app/sign-in/[[...sign-in]]/page.tsx', 'saas sign-in'],
            // sso-callback - both
            ['c:/Users/1/Desktop/alfa/src/app/sso-callback/page.tsx', '/www/wwwroot/namainvist.com/src/app/sso-callback/page.tsx', 'main sso-cb'],
            ['c:/Users/1/Desktop/alfa/src/app/sso-callback/page.tsx', '/www/wwwroot/n11.namainvist.com/src/app/sso-callback/page.tsx', 'saas sso-cb'],
        ];
        let done = 0;
        files.forEach(([local, remote, label]) => {
            // create directory first
            const dir = remote.substring(0, remote.lastIndexOf('/'));
            conn.exec(`mkdir -p "${dir}"`, () => {
                sftp.fastPut(local, remote, {}, err => {
                    if (err) console.error(`❌ ${label}:`, err.message);
                    else console.log(`✅ ${label}`);
                    done++;
                    if (done === files.length) {
                        console.log('\n🔨 Building main-site...');
                        conn.exec(
                            'cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart main-site && echo "✅ main"',
                            (e, s) => {
                                s.on('data', d => process.stdout.write(d.toString()));
                                s.on('close', () => {
                                    console.log('\n🔨 Building saas-app...');
                                    conn.exec(
                                        'cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart saas-app && echo "✅ saas"',
                                        (e2, s2) => {
                                            s2.on('data', d => process.stdout.write(d.toString()));
                                            s2.stderr.on('data', d => process.stderr.write(d.toString()));
                                            s2.on('close', () => { console.log('✅ ALL DONE'); conn.end(); });
                                        }
                                    );
                                });
                            }
                        );
                    }
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
