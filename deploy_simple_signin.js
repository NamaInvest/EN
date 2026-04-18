const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        let done = 0;
        const files = [
            ['d:/namasoft9-3-main/src/app/sign-in/[[...sign-in]]/page.tsx', '/www/wwwroot/namainvist.com/src/app/sign-in/[[...sign-in]]/page.tsx', 'main sign-in'],
            ['d:/namasoft9-3-main/src/app/sign-in/[[...sign-in]]/page.tsx', '/www/wwwroot/n11.namainvist.com/src/app/sign-in/[[...sign-in]]/page.tsx', 'saas sign-in'],
        ];
        files.forEach(([local, remote, label]) => {
            sftp.fastPut(local, remote, {}, err => {
                if (err) console.error(`❌ ${label}:`, err.message);
                else console.log(`✅ ${label}`);
                done++;
                if (done === files.length) {
                    conn.exec(
                        'cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -4 && pm2 restart main-site && echo "✅ main done" && cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -4 && pm2 restart saas-app && echo "✅ saas done"',
                        (e, s) => {
                            s.on('data', d => process.stdout.write(d.toString()));
                            s.stderr.on('data', d => process.stderr.write(d.toString()));
                            s.on('close', () => conn.end());
                        }
                    );
                }
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
