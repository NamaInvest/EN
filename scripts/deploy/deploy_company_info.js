const { Client } = require('ssh2');
const conn = new Client();
const N11 = '/www/wwwroot/n11.namainvist.com';
const MAIN = '/www/wwwroot/namainvist.com';

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) { console.error(err); conn.end(); return; }
        sftp.fastPut('c:/Users/1/Desktop/alfa/src/app/company-info/page.tsx', `${N11}/src/app/company-info/page.tsx`, {}, (e1) => {
            sftp.fastPut('c:/Users/1/Desktop/alfa/src/app/company-info/page.tsx', `${MAIN}/src/app/company-info/page.tsx`, {}, (e2) => {
                conn.exec(`
cd ${MAIN}
npm run build 2>&1 | tail -6
pm2 restart main-site
cd ${N11}
npm run build 2>&1 | tail -6
pm2 restart saas-app
`, (err2, stream) => {
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                    stream.on('close', () => { console.log('🎉 Done fixing company-info redirect'); conn.end(); });
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
