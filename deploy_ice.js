const {Client} = require('ssh2');
const fs = require('fs');
const c = new Client();

const filesToUpload = [
    ['src/app/ice/page.tsx', '/www/wwwroot/namainvist.com/src/app/ice/page.tsx'],
    ['src/app/api/ice/toggle/route.ts', '/www/wwwroot/namainvist.com/src/app/api/ice/toggle/route.ts'],
    ['src/app/api/ice/tenants/route.ts', '/www/wwwroot/namainvist.com/src/app/api/ice/tenants/route.ts'],
    ['src/app/api/ice/auth/route.ts', '/www/wwwroot/namainvist.com/src/app/api/ice/auth/route.ts'],
    ['src/middleware.ts', '/www/wwwroot/namainvist.com/src/middleware.ts'],
];

c.on('ready', () => {
    console.log('Connected, uploading files...');
    c.sftp((e, sftp) => {
        // Ensure auth directory exists
        sftp.mkdir('/www/wwwroot/namainvist.com/src/app/api/ice/auth', (err) => {
            let done = 0;
            for (const [local, remote] of filesToUpload) {
                sftp.writeFile(remote, fs.readFileSync(local), () => {
                    console.log(`✅ ${local}`);
                    done++;
                    if (done === filesToUpload.length) {
                        sftp.end();
                        console.log('Building...');
                        c.exec('cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -5 && pm2 restart main-site 2>&1 | grep main-site && echo DONE', (e, s) => {
                            s.on('data', d => process.stdout.write(d));
                            s.stderr.on('data', d => process.stderr.write(d));
                            s.on('close', () => { console.log('\nAll done!'); c.end(); });
                        });
                    }
                });
            }
        });
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
