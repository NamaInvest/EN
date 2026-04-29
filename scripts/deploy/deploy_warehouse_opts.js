const { Client } = require('ssh2');
const path = require('path');
const conn = new Client();
const BASE = '/www/wwwroot/n11.namainvist.com';
const FILES = [
    'src/components/Sidebar.tsx',
    'src/app/(dashboard)/settings/page.tsx',
    'src/app/(dashboard)/warehouses/options/page.tsx',
];
conn.on('ready', () => {
    conn.exec(`mkdir -p "${BASE}/src/app/(dashboard)/warehouses/options"`, (e, s) => {
        s.on('close', () => {
            conn.sftp((e, sftp) => {
                let i = 0;
                const next = () => {
                    if (i >= FILES.length) {
                        sftp.end();
                        conn.exec(`cd ${BASE} && npm run build 2>&1 | tail -4 && pm2 restart n11 && echo DONE`, (e, s2) => {
                            s2.on('data', d => process.stdout.write(d));
                            s2.stderr.on('data', d => process.stderr.write(d));
                            s2.on('close', () => conn.end());
                        });
                        return;
                    }
                    const f = FILES[i++];
                    sftp.fastPut(path.join(__dirname, f), `${BASE}/${f}`, (e) => {
                        if (e) console.error('ERR', f, e.message); else console.log('📤', f);
                        next();
                    });
                };
                next();
            });
        });
        s.resume();
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
