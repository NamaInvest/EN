const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    const baseDir = '/var/www/namasoft';
    console.log('Deploying with LF encoding to:', baseDir);
    
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const files = [
            { local: 'd:\\namasoft9-3-main\\src\\components\\InvoiceReceipt.tsx', remote: baseDir + '/src/components/InvoiceReceipt.tsx' },
            { local: 'd:\\namasoft9-3-main\\src\\components\\VoucherReceipt.tsx', remote: baseDir + '/src/components/VoucherReceipt.tsx' },
            { local: 'd:\\namasoft9-3-main\\src\\app\\api\\zatca\\qr\\route.ts', remote: baseDir + '/src/app/api/zatca/qr/route.ts' }
        ];
        
        const uploadNext = (idx) => {
            if (idx >= files.length) {
                console.log('Uploading complete. Running build and restarting PM2...');
                conn.exec(`cd ${baseDir} && npm run build && pm2 restart namasoft`, (err, stream2) => {
                    if (err) throw err;
                    stream2.on('data', d => process.stdout.write(d.toString()));
                    stream2.stderr.on('data', d => process.stderr.write(d.toString()));
                    stream2.on('close', (code) => {
                        console.log('\nDeployment completely successful! Code:', code);
                        conn.end();
                    });
                });
                return;
            }
            
            // Convert CRLF to LF
            const content = fs.readFileSync(files[idx].local, 'utf8').replace(/\r\n/g, '\n');
            const stream = sftp.createWriteStream(files[idx].remote);
            stream.on('close', () => {
                 console.log('Uploaded (LF) =>', files[idx].remote);
                 uploadNext(idx+1);
            });
            stream.on('error', err => { throw err; });
            stream.write(content);
            stream.end();
        };
        uploadNext(0);
    });
}).on('error', (err) => {
    console.error('Connection Error:', err);
}).connect({ 
    host: '185.197.195.202', 
    port: 22, 
    username: 'root', 
    password: 'VmJUML2LuezRSws',
    readyTimeout: 30000 
});
