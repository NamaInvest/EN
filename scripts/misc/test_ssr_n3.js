const { Client } = require('ssh2');
const conn = new Client();
const BASE = '/www/wwwroot/n3.namainvist.com';
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.mkdir(`${BASE}/src/app/test-i18n`, { recursive: true }, (err) => {
            sftp.fastPut('src/app/test-i18n/page.tsx', `${BASE}/src/app/test-i18n/page.tsx`, (err) => {
                if (err) throw err;
                console.log('Uploaded test file. Rebuilding n3...');
                const cmd = `cd ${BASE} && npm run build 2>&1 | tail -5 && pm2 restart n3 && sleep 3 && curl -s http://localhost:3003/test-i18n`;
                conn.exec(cmd, (err, stream) => {
                    let out = '';
                    stream.on('data', d => out += d.toString());
                    stream.on('close', () => { console.log(out); conn.end(); });
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
