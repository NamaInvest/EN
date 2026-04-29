const { Client } = require('ssh2');
const fs = require('fs');

const pageTsxContent = fs.readFileSync('c:\\Users\\1\\Desktop\\alfa\\src\\app\\onboarding\\provisioning\\page.tsx', 'utf8');

// Verify local file is correct (shouldn't have companyNameEn field)
const hasEnField = pageTsxContent.includes('اسم المنشأة بالإنجليزية');
const hasBusinessDomain = pageTsxContent.includes('businessDomain');
const hasBranchName = pageTsxContent.includes('branchName');
const hasCRNmaxLength = pageTsxContent.includes('maxLength={10}');

console.log('Local page.tsx check:');
console.log('Has EN field (should be false):', hasEnField);
console.log('Has businessDomain:', hasBusinessDomain);
console.log('Has branchName:', hasBranchName);
console.log('Has CRN maxLength=10:', hasCRNmaxLength);

const conn = new Client();
conn.on('ready', () => {
    console.log('\nUploading page.tsx via SFTP...');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const buf = Buffer.from(pageTsxContent, 'utf8');
        const remotePath = '/www/wwwroot/namainvist.com/src/app/onboarding/provisioning/page.tsx';
        sftp.open(remotePath, 'w', (e, handle) => {
            if (e) throw e;
            sftp.write(handle, buf, 0, buf.length, 0, (e2) => {
                if (e2) throw e2;
                sftp.close(handle, () => {
                    console.log('Uploaded! Let me verify what is on server now...');
                    conn.exec(`grep -c "اسم المنشأة بالإنجليزية" /www/wwwroot/namainvist.com/src/app/onboarding/provisioning/page.tsx && echo "OLD FILE STILL THERE" || echo "FILE IS UPDATED"`, (e3, stream) => {
                        if (e3) throw e3;
                        stream.on('data', d => process.stdout.write(d));
                        stream.stderr.on('data', d => process.stdout.write(d));
                        stream.on('close', () => {
                            console.log('Rebuilding...');
                            conn.exec('cd /www/wwwroot/namainvist.com && npm run build && pm2 restart nama-landing', (e4, s2) => {
                                if (e4) throw e4;
                                s2.on('data', d => process.stdout.write(d));
                                s2.stderr.on('data', d => process.stdout.write(d));
                                s2.on('close', () => {
                                    console.log('Done! Clearing Cloudflare cache...');
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
