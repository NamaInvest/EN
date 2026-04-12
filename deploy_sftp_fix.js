const { Client } = require('ssh2');
const fs = require('fs');

const routeTsContent = fs.readFileSync('d:\\namasoft9-3-main\\src\\app\\api\\tenant\\provision\\route.ts', 'utf8');
const pageTsxContent = fs.readFileSync('d:\\namasoft9-3-main\\src\\app\\onboarding\\provisioning\\page.tsx', 'utf8');

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH ready. Uploading files via SFTP...');
    conn.sftp((err, sftp) => {
        if (err) throw err;

        const writeFile = (remotePath, content) => new Promise((res, rej) => {
            const buf = Buffer.from(content, 'utf8');
            const stream = sftp.open(remotePath, 'w', (e, handle) => {
                if (e) return rej(e);
                sftp.write(handle, buf, 0, buf.length, 0, (e2) => {
                    if (e2) return rej(e2);
                    sftp.close(handle, () => res());
                });
            });
        });

        Promise.all([
            writeFile('/www/wwwroot/namainvist.com/src/app/api/tenant/provision/route.ts', routeTsContent),
            writeFile('/www/wwwroot/namainvist.com/src/app/onboarding/provisioning/page.tsx', pageTsxContent),
        ]).then(() => {
            console.log('Files uploaded. Rebuilding...');
            conn.exec('cd /www/wwwroot/namainvist.com && npm run build && pm2 restart nama-landing', (e2, stream) => {
                if (e2) throw e2;
                stream.on('data', d => process.stdout.write(d));
                stream.stderr.on('data', d => process.stdout.write(d));
                stream.on('close', () => {
                    console.log('Done!');
                    conn.end();
                });
            });
        }).catch(e => {
            console.error('SFTP Error:', e);
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 10000
});
