const { Client } = require('ssh2');
const fs = require('fs');

const pageTsxContent = fs.readFileSync('c:\\Users\\1\\Desktop\\alfa\\src\\app\\onboarding\\provisioning\\page.tsx', 'utf8');

// Confirm the local file is correct
const hasNewFields = pageTsxContent.includes('businessDomain') && pageTsxContent.includes('branchName');
const hasEnField = pageTsxContent.includes('اسم المنشأة بالإنجليزية');
const hasDynamic = pageTsxContent.includes("force-dynamic");
console.log('Has businessDomain/branchName:', hasNewFields);
console.log('Has English name field (should be false):', hasEnField);
console.log('Has force-dynamic:', hasDynamic);

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const buf = Buffer.from(pageTsxContent, 'utf8');
        const remotePath = '/www/wwwroot/namainvist.com/src/app/onboarding/provisioning/page.tsx';
        sftp.open(remotePath, 'w', (e, handle) => {
            if (e) throw e;
            sftp.write(handle, buf, 0, buf.length, 0, (e2) => {
                if (e2) throw e2;
                sftp.close(handle, () => {
                    console.log('Uploaded! Building...');
                    conn.exec('cd /www/wwwroot/namainvist.com && npm run build && pm2 restart nama-landing', (e3, stream) => {
                        if (e3) throw e3;
                        stream.on('data', d => process.stdout.write(d));
                        stream.stderr.on('data', d => process.stdout.write(d));
                        stream.on('close', () => {
                            // Verify the remote file is correct
                            conn.exec(`grep -c "force-dynamic" /www/wwwroot/namainvist.com/src/app/onboarding/provisioning/page.tsx`, (e4, s2) => {
                                s2.on('data', d => console.log('force-dynamic count on server:', d.toString().trim()));
                                s2.on('close', () => {
                                    console.log('Done!');
                                    conn.end();
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000 });
