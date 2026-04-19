const {Client} = require('ssh2');
const fs = require('fs');
const c = new Client();
c.on('ready', () => {
    c.sftp((e, sftp) => {
        const files = [
            ['src/middleware.ts', '/www/wwwroot/n11.namainvist.com/src/middleware.ts'],
            ['src/app/login/page.tsx', '/www/wwwroot/n11.namainvist.com/src/app/login/page.tsx'],
        ];
        let done = 0;
        for (const [local, remote] of files) {
            sftp.writeFile(remote, fs.readFileSync(local), (err) => {
                if (err) console.log('❌', local);
                else console.log('✅', local);
                done++;
                if (done === files.length) {
                    sftp.end();
                    c.exec('cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart saas-app 2>&1 | grep saas-app && echo DONE', (e, s) => {
                        s.on('data', d => process.stdout.write(d.toString()));
                        s.stderr.on('data', d => process.stderr.write(d.toString()));
                        s.on('close', () => { console.log('\nDone!'); c.end(); });
                    });
                }
            });
        }
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
