const { Client } = require('ssh2');
const fs = require('fs');

const nextConfigContent = fs.readFileSync('d:\\namasoft9-3-main\\next.config.ts', 'utf8');
const pageTsxContent = fs.readFileSync('d:\\namasoft9-3-main\\src\\app\\onboarding\\provisioning\\page.tsx', 'utf8');

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;

        const writeFile = (remotePath, content) => new Promise((res, rej) => {
            const buf = Buffer.from(content, 'utf8');
            sftp.open(remotePath, 'w', (e, handle) => {
                if (e) return rej(e);
                sftp.write(handle, buf, 0, buf.length, 0, (e2) => {
                    if (e2) return rej(e2);
                    sftp.close(handle, () => res());
                });
            });
        });

        console.log('Uploading next.config.ts and page.tsx...');
        Promise.all([
            writeFile('/www/wwwroot/namainvist.com/next.config.ts', nextConfigContent),
            writeFile('/www/wwwroot/namainvist.com/src/app/onboarding/provisioning/page.tsx', pageTsxContent),
        ]).then(() => {
            console.log('Uploaded! Rebuilding...');
            conn.exec('cd /www/wwwroot/namainvist.com && npm run build && pm2 restart nama-landing', (e2, stream) => {
                if (e2) throw e2;
                stream.on('data', d => process.stdout.write(d));
                stream.stderr.on('data', d => process.stdout.write(d));
                stream.on('close', () => {
                    console.log('Done!');
                    conn.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
