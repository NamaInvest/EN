const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const BASE = '/www/wwwroot/n11.namainvist.com';

conn.on('ready', () => {
    console.log('Connected...');
    conn.sftp((err, sftp) => {
        if (err) { conn.end(); return; }

        const FILES = [
            { local: 'src/components/Sidebar.tsx', remote: `${BASE}/src/components/Sidebar.tsx` },
            { local: 'src/app/(dashboard)/settings/page.tsx', remote: `${BASE}/src/app/(dashboard)/settings/page.tsx` },
            { local: 'src/app/(dashboard)/company-info/page.tsx', remote: `${BASE}/src/app/(dashboard)/company-info/page.tsx` },
        ];

        // Ensure company-info dir exists first
        conn.exec(`mkdir -p "${BASE}/src/app/(dashboard)/company-info"`, (e, s) => {
            s?.on('close', () => {
                let idx = 0;
                const next = () => {
                    if (idx >= FILES.length) {
                        sftp.end();
                        console.log('All uploaded. Building...');
                        conn.exec(`cd ${BASE} && npm run build 2>&1 | tail -5 && pm2 restart n11 && pm2 save && echo "OK"`, (e, s2) => {
                            s2.on('data', d => process.stdout.write(d));
                            s2.stderr.on('data', d => process.stderr.write(d));
                            s2.on('close', () => conn.end());
                        });
                        return;
                    }
                    const { local, remote } = FILES[idx++];
                    sftp.fastPut(path.join(__dirname, local), remote, (e) => {
                        if (e) console.error('❌', local, e.message);
                        else console.log('📤', local);
                        next();
                    });
                };
                next();
            });
            s?.on('data', d => process.stdout.write(d));
            s?.stderr?.on('data', d => process.stderr.write(d));
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
