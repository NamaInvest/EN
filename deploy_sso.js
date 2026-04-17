const { Client } = require('ssh2');
const path = require('path');
const conn = new Client();

const MAIN = '/www/wwwroot/namainvist.com';
const N1   = '/www/wwwroot/n1.namainvist.com';

const files = [
    // Main site files
    { local: 'src/app/api/tenant/provision/route.ts',  remote: MAIN + '/src/app/api/tenant/provision/route.ts' },
    { local: 'src/app/company-info/page.tsx',          remote: MAIN + '/src/app/company-info/page.tsx' },
    // N1 tenant files (will copy to all tenants via SSH)
    { local: 'src/app/api/auth/auto-login/route.ts',   remote: N1   + '/src/app/api/auth/auto-login/route.ts' },
    { local: 'src/app/auto-login/page.tsx',             remote: N1   + '/src/app/auto-login/page.tsx' },
];

conn.on('ready', () => {
    console.log('✅ متصل');
    conn.sftp((err, sftp) => {
        let done = 0;
        const total = files.length;
        files.forEach(f => {
            sftp.fastPut('d:/namasoft9-3-main/' + f.local, f.remote, (err) => {
                if (err) console.log('❌ ' + f.local + ': ' + err.message);
                else console.log('📤 ' + path.basename(f.local) + ' → ' + (f.remote.includes('n1') ? 'N1' : 'main-site'));
                done++;
                if (done === total) {
                    // Also copy auto-login files to the new namainvest tenant
                    const cmd = [
                        // Copy auto-login to namainvest tenant
                        'mkdir -p /www/wwwroot/namainvest.namainvist.com/src/app/api/auth/auto-login',
                        'mkdir -p /www/wwwroot/namainvest.namainvist.com/src/app/auto-login',
                        'cp /www/wwwroot/n1.namainvist.com/src/app/api/auth/auto-login/route.ts /www/wwwroot/namainvest.namainvist.com/src/app/api/auth/auto-login/',
                        'cp /www/wwwroot/n1.namainvist.com/src/app/auto-login/page.tsx /www/wwwroot/namainvest.namainvist.com/src/app/auto-login/',
                        // Build main site
                        `cd ${MAIN} && npm run build 2>&1 | tail -3`,
                        `pm2 restart main-site`,
                        // Build N1 and namainvest tenant
                        `cd ${N1} && npm run build 2>&1 | tail -3`,
                        `pm2 restart n1-main`,
                        `cd /www/wwwroot/namainvest.namainvist.com && npm run build 2>&1 | tail -3`,
                        `pm2 restart namainvest`,
                        'echo ALL_DONE',
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
