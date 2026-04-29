const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        let done = 0;
        const files = [
            ['c:/Users/1/Desktop/alfa/src/middleware.ts', '/www/wwwroot/namainvist.com/src/middleware.ts', 'main-site middleware'],
            ['c:/Users/1/Desktop/alfa/src/middleware.ts', '/www/wwwroot/n11.namainvist.com/src/middleware.ts', 'saas-app middleware'],
            ['c:/Users/1/Desktop/alfa/src/app/auto-login/page.tsx', '/www/wwwroot/n11.namainvist.com/src/app/auto-login/page.tsx', 'saas-app auto-login'],
        ];
        files.forEach(([local, remote, label]) => {
            sftp.fastPut(local, remote, {}, err => {
                if (err) console.error(`❌ ${label}:`, err.message);
                else console.log(`✅ ${label}`);
                done++;
                if (done === files.length) {
                    console.log('\n🔨 Building main-site...');
                    conn.exec(
                        'cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart main-site --update-env && echo "✅ main-site OK"',
                        (e, s) => {
                            s.on('data', d => process.stdout.write(d.toString()));
                            s.on('close', () => {
                                console.log('\n🔨 Building saas-app...');
                                conn.exec(
                                    'cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart saas-app && echo "✅ saas-app OK"',
                                    (e2, s2) => {
                                        s2.on('data', d => process.stdout.write(d.toString()));
                                        s2.stderr.on('data', d => process.stderr.write(d.toString()));
                                        s2.on('close', () => { console.log('✅ DONE'); conn.end(); });
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
