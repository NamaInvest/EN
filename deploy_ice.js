const {Client} = require('ssh2');
const fs = require('fs');
const c = new Client();
c.on('ready', () => {
    c.sftp((e, sftp) => {
        const files = [
            // Core fixes
            ['src/lib/quotaGuard.ts', '/www/wwwroot/n11.namainvist.com/src/lib/quotaGuard.ts'],
            ['src/app/api/users/route.ts', '/www/wwwroot/n11.namainvist.com/src/app/api/users/route.ts'],
            ['src/app/api/tenant/hidden-modules/route.ts', '/www/wwwroot/n11.namainvist.com/src/app/api/tenant/hidden-modules/route.ts'],
            ['src/app/auto-login/page.tsx', '/www/wwwroot/n11.namainvist.com/src/app/auto-login/page.tsx'],
            // New API
            ['src/app/api/auth/find-tenant-by-email/route.ts', '/www/wwwroot/n11.namainvist.com/src/app/api/auth/find-tenant-by-email/route.ts'],
            // ICE fixes (main site handles ICE panel)
            ['src/app/api/ice/tenants/route.ts', '/www/wwwroot/namainvist.com/src/app/api/ice/tenants/route.ts'],
            ['src/app/api/ice/toggle/route.ts', '/www/wwwroot/namainvist.com/src/app/api/ice/toggle/route.ts'],
            ['src/lib/quotaGuard.ts', '/www/wwwroot/namainvist.com/src/lib/quotaGuard.ts'],
            ['src/app/api/users/route.ts', '/www/wwwroot/namainvist.com/src/app/api/users/route.ts'],
            ['src/app/api/tenant/hidden-modules/route.ts', '/www/wwwroot/namainvist.com/src/app/api/tenant/hidden-modules/route.ts'],
            ['src/app/auto-login/page.tsx', '/www/wwwroot/namainvist.com/src/app/auto-login/page.tsx'],
            ['src/app/api/auth/find-tenant-by-email/route.ts', '/www/wwwroot/namainvist.com/src/app/api/auth/find-tenant-by-email/route.ts'],
        ];
        let done = 0;
        let errors = 0;
        for (const [local, remote] of files) {
            // Ensure directory exists
            const dir = remote.substring(0, remote.lastIndexOf('/'));
            sftp.mkdir(dir, { recursive: true }, () => {
                sftp.writeFile(remote, fs.readFileSync(local), (err) => {
                    if (err) { console.log('❌', local, err.message); errors++; }
                    else console.log('✅', local);
                    done++;
                    if (done === files.length) {
                        sftp.end();
                        console.log(`\n${done - errors}/${done} files deployed. Rebuilding...`);
                        c.exec('cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart saas-app --silent && echo "SAAS OK" && cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart main-site --silent && echo "MAIN OK"', (e, s) => {
                            s.on('data', d => process.stdout.write(d.toString()));
                            s.stderr.on('data', d => process.stderr.write(d.toString()));
                            s.on('close', () => { console.log('\n🎉 All done!'); c.end(); });
                        });
                    }
                });
            });
        }
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
