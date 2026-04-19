const {Client} = require('ssh2');
const fs = require('fs');
const c = new Client();
c.on('ready', () => {
    c.sftp((e, sftp) => {
        const files = [
            { local: 'src/middleware.ts', remote: '/www/wwwroot/n11.namainvist.com/src/middleware.ts' },
            { local: 'src/app/login/page.tsx', remote: '/www/wwwroot/n11.namainvist.com/src/app/login/page.tsx' },
            { local: 'src/app/(dashboard)/dashboard/page.tsx', remote: '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/dashboard/page.tsx' },
        ];
        let done = 0;
        for (const f of files) {
            sftp.writeFile(f.remote, fs.readFileSync(f.local), (err) => {
                console.log(err ? `❌ ${f.remote}` : `✅ ${f.remote}`);
                done++;
                if (done === files.length) {
                    sftp.end();
                    c.exec('cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -3 && pm2 restart saas-app --silent && echo "SAAS OK"', (e, s) => {
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
