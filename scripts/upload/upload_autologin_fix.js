const { Client } = require('ssh2');
const conn = new Client();
const N11 = '/www/wwwroot/n11.namainvist.com';

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) { console.error(err); conn.end(); return; }
        sftp.fastPut('c:/Users/1/Desktop/alfa/src/app/auto-login/page.tsx', `${N11}/src/app/auto-login/page.tsx`, () => {
            conn.exec(`cd ${N11} && npm run build 2>&1 | tail -6 && pm2 reload saas-app`, (e, s) => {
                s.on('close', () => { console.log('Done mapping auto-login correctly'); conn.end(); });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
