const { Client } = require('ssh2');
const path = require('path');

const files = [
    'src/app/login/page.tsx',
    'src/components/InactivityGuard.tsx',
    'src/components/Sidebar.tsx',
    'src/app/(dashboard)/settings/page.tsx'
];

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to VPS');
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        let done = 0;
        for (const file of files) {
            const localPath = path.resolve('c:/Users/1/Desktop/alfa', file);
            const remotePath = `/var/www/namasoft/${file}`;
            sftp.fastPut(localPath, remotePath, (e) => {
                done++;
                if (e) console.error('FAIL', file, e.message);
                else console.log('OK', file);
                
                if (done === files.length) {
                    console.log('\nAll Hotfix files uploaded!');
                    // Trigger build
                    const buildCmd = 'rm -f /tmp/rebuild_hotfix_status.txt && cd /var/www/namasoft && nohup bash -c "npm run build > /tmp/rebuild_hotfix.log 2>&1 && pm2 reload namasoft && echo DONE > /tmp/rebuild_hotfix_status.txt" > /dev/null 2>&1 &';
                    conn.exec(buildCmd, (e2, s2) => {
                        if (e2) throw e2;
                        s2.on('close', () => { 
                            console.log('Build kicked off in background on VPS!'); 
                            conn.end(); 
                        });
                    });
                }
            });
        }
    });
}).on('error', (err) => {
    console.error('Connection logic error:', err);
}).connect({
    host: '185.197.195.202', port: 22, username: 'root', password: 'VmJUML2LuezRSws', keepaliveInterval: 10000
});
