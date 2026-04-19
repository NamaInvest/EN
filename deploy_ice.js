const {Client} = require('ssh2');
const fs = require('fs');
const c = new Client();
c.on('ready', () => {
    c.sftp((e, sftp) => {
        const usersRoute = fs.readFileSync('src/app/api/users/route.ts');
        const targets = [
            '/www/wwwroot/n11.namainvist.com/src/app/api/users/route.ts',
            '/www/wwwroot/namainvist.com/src/app/api/users/route.ts',
        ];
        let done = 0;
        for (const t of targets) {
            sftp.writeFile(t, usersRoute, (err) => {
                if (err) console.log('❌', t);
                else console.log('✅', t);
                done++;
                if (done === targets.length) {
                    sftp.end();
                    c.exec('cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart saas-app --silent && echo "SAAS OK" && cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart main-site --silent && echo "MAIN OK"', (e, s) => {
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
