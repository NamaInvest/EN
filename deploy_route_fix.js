const { Client } = require('ssh2');
const fs = require('fs');

const routeContent = fs.readFileSync('d:\\namasoft9-3-main\\src\\app\\api\\tenant\\provision\\route.ts', 'utf8');

const conn = new Client();
conn.on('ready', () => {
    console.log('Uploading new route.ts via SFTP...');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const buf = Buffer.from(routeContent, 'utf8');
        const remotePath = '/www/wwwroot/namainvist.com/src/app/api/tenant/provision/route.ts';
        const stream = sftp.open(remotePath, 'w', (e, handle) => {
            if (e) throw e;
            sftp.write(handle, buf, 0, buf.length, 0, (e2) => {
                if (e2) throw e2;
                sftp.close(handle, () => {
                    console.log('File uploaded! Rebuilding landing page...');
                    conn.exec('cd /www/wwwroot/namainvist.com && npm run build && pm2 restart nama-landing', (e3, s) => {
                        if (e3) throw e3;
                        s.on('data', d => process.stdout.write(d));
                        s.stderr.on('data', d => process.stdout.write(d));
                        s.on('close', () => {
                            console.log('Done!');
                            conn.end();
                        });
                    });
                });
            });
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 10000
});
