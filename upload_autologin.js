const { Client } = require('ssh2');
const conn = new Client();
const N11 = '/www/wwwroot/n11.namainvist.com';

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) { console.error(err); conn.end(); return; }

        console.log('mkdir...');
        conn.exec(`mkdir -p ${N11}/src/app/auto-login && mkdir -p ${N11}/src/app/api/auth/auto-login`, (err1) => {
            let pending = 3;
            const done = () => {
                if (--pending === 0) {
                    console.log('building...');
                    conn.exec(`cd ${N11} && npm run build 2>&1 | tail -6 && pm2 reload saas-app`, (e, s) => {
                        s.on('data', d => process.stdout.write(d.toString()));
                        s.on('close', () => { console.log('Done uploading auto-login'); conn.end(); });
                    });
                }
            };
            
            console.log('uploading files...');
            sftp.fastPut('d:/namasoft9-3-main/src/app/auto-login/page.tsx', `${N11}/src/app/auto-login/page.tsx`, done);
            sftp.fastPut('d:/namasoft9-3-main/src/app/api/auth/auto-login/route.ts', `${N11}/src/app/api/auth/auto-login/route.ts`, done);
            sftp.fastPut('d:/namasoft9-3-main/src/middleware.ts', `${N11}/src/middleware.ts`, done);
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
