const {Client} = require('ssh2');
const fs = require('fs');
const c = new Client();
c.on('ready', () => {
    c.sftp((e, sftp) => {
        const targets = [
            '/www/wwwroot/n11.namainvist.com/src/components/Sidebar.tsx',
            '/www/wwwroot/namainvist.com/src/components/Sidebar.tsx',
        ];
        let done = 0;
        const content = fs.readFileSync('src/components/Sidebar.tsx');
        for (const t of targets) {
            sftp.writeFile(t, content, (err) => {
                console.log(err ? `❌ ${t}` : `✅ ${t}`);
                if (++done === targets.length) {
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
