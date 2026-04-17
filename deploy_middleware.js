const { Client } = require('ssh2');
const path = require('path');
const conn = new Client();
const APP = '/www/wwwroot/namainvist.com';
const files = ['src/middleware.ts'];

conn.on('ready', () => {
    console.log('متصل...');
    conn.sftp((err, sftp) => {
        let done = 0;
        files.forEach(f => {
            sftp.fastPut('d:/namasoft9-3-main/' + f, APP + '/' + f, (err) => {
                if (err) console.log('خطأ ' + f + ': ' + err.message);
                else console.log('📤 ' + f);
                done++;
                if (done === files.length) {
                    const cmd = [
                        // Add CLERK_AFTER_SIGN_UP_URL to .env if not exists
                        `grep -q CLERK_AFTER_SIGN_UP_URL ${APP}/.env || printf '\\nNEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/company-info\\n' >> ${APP}/.env`,
                        `cd ${APP} && npm run build 2>&1 | tail -5`,
                        `pm2 restart main-site --update-env`,
                        `echo "DONE"`
                    ].join(' && ');
                    conn.exec(cmd, (err, s) => {
                        s.on('data', d => process.stdout.write(d.toString()));
                        s.stderr.on('data', d => process.stderr.write(d.toString()));
                        s.on('close', () => conn.end());
                    });
                }
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
