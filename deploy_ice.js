const {Client} = require('ssh2');
const fs = require('fs');
const path = require('path');

const files = ['src/components/Sidebar.tsx', 'src/app/layout.tsx'];
const servers = [
    { name: 'main-site', path: '/www/wwwroot/namainvist.com', pm2: 'main-site' },
    { name: 'saas-app', path: '/www/wwwroot/n11.namainvist.com', pm2: 'saas-app' },
];

let done = 0;
servers.forEach(srv => {
    const c = new Client();
    c.on('ready', () => {
        c.sftp((e, sftp) => {
            let uploaded = 0;
            files.forEach(f => {
                const remote = srv.path + '/' + f;
                sftp.writeFile(remote, fs.readFileSync(f), () => {
                    console.log(`✅ [${srv.name}] ${path.basename(f)}`);
                    uploaded++;
                    if (uploaded === files.length) {
                        sftp.end();
                        c.exec(`cd ${srv.path} && npm run build 2>&1 | tail -3 && pm2 restart ${srv.pm2} --silent && echo "[${srv.name}] DONE"`, (e, s) => {
                            s.on('data', d => process.stdout.write(d.toString()));
                            s.stderr.on('data', d => process.stderr.write(d.toString()));
                            s.on('close', () => { c.end(); done++; if (done === servers.length) console.log('\n🏁 All done!'); });
                        });
                    }
                });
            });
        });
    });
    c.connect({host:'46.4.188.170',port:22,username:'root',password:'_ee4SWbxLVfH9b'});
});
