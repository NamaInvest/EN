const {Client} = require('ssh2');
const fs = require('fs');
const c = new Client();
c.on('ready', () => {
    c.sftp((e, sftp) => {
        const files = [
            { local: 'src/components/Sidebar.tsx', remotes: ['/www/wwwroot/n11.namainvist.com/src/components/Sidebar.tsx', '/www/wwwroot/namainvist.com/src/components/Sidebar.tsx'] },
            { local: 'src/app/api/auth/login/route.ts', remotes: ['/www/wwwroot/n11.namainvist.com/src/app/api/auth/login/route.ts', '/www/wwwroot/namainvist.com/src/app/api/auth/login/route.ts'] },
        ];
        
        let total = 0;
        let done = 0;
        for (const f of files) total += f.remotes.length;
        
        for (const f of files) {
            const content = fs.readFileSync(f.local);
            for (const remote of f.remotes) {
                sftp.writeFile(remote, content, (err) => {
                    console.log(err ? `❌ ${remote}: ${err.message}` : `✅ ${remote}`);
                    done++;
                    if (done === total) {
                        // Now upload settings page via SSH (base64 in smaller chunks)
                        const settingsContent = fs.readFileSync('src/app/(dashboard)/settings/page.tsx');
                        const settingsB64 = settingsContent.toString('base64');
                        // Write to temp file first
                        sftp.writeFile('/tmp/settings_page.b64', settingsB64, () => {
                            sftp.end();
                            c.exec([
                                'base64 -d /tmp/settings_page.b64 > \'/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/settings/page.tsx\'',
                                'echo "SETTINGS WRITTEN"',
                                'cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -3 && pm2 restart saas-app --silent && echo "SAAS OK"',
                                'cd /www/wwwroot/namainvist.com && npm run build 2>&1 | tail -3 && pm2 restart main-site --silent && echo "MAIN OK"',
                            ].join(' && '), (e, s) => {
                                s.on('data', d => process.stdout.write(d.toString()));
                                s.stderr.on('data', d => process.stderr.write(d.toString()));
                                s.on('close', () => { console.log('\nDone!'); c.end(); });
                            });
                        });
                    }
                });
            }
        }
    });
});
c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
