const fs = require('fs');
const { Client } = require('ssh2');

const conn = new Client();

const filesToUpload = [
    { local: 'src/app/(dashboard)/sales/orders/create/page.tsx', remote: '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/sales/orders/create/page.tsx' },
    { local: 'src/app/api/sales-orders/route.ts', remote: '/www/wwwroot/n11.namainvist.com/src/app/api/sales-orders/route.ts' },
    { local: 'src/app/(dashboard)/price-quotes/page.tsx', remote: '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/price-quotes/page.tsx' },
    { local: 'src/app/api/price-quotes/route.ts', remote: '/www/wwwroot/n11.namainvist.com/src/app/api/price-quotes/route.ts' },
    { local: 'src/app/(dashboard)/sales/page.tsx', remote: '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/sales/page.tsx' },
    { local: 'src/app/(dashboard)/sales/options/page.tsx', remote: '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/sales/options/page.tsx' }
];

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        let index = 0;
        const uploadNext = () => {
            if (index >= filesToUpload.length) {
                console.log('All files uploaded, rebuilding app...');
                conn.exec('cd /www/wwwroot/n11.namainvist.com && rm -rf .next && npm run build && pm2 restart n11 --update-env', (err, stream) => {
                    if (err) throw err;
                    stream.on('close', () => {
                        console.log('Deployment Done');
                        conn.end();
                    }).on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                });
                return;
            }
            const current = filesToUpload[index];
            sftp.fastPut(current.local, current.remote, (err) => {
                if (err) throw err;
                console.log(`Uploaded ${current.local}`);
                index++;
                uploadNext();
            });
        };
        uploadNext();
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
