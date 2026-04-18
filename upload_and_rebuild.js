const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        // Upload lib/email.ts
        sftp.fastPut(
            'd:/namasoft9-3-main/src/lib/email.ts',
            '/www/wwwroot/n11.namainvist.com/src/lib/email.ts',
            {},
            putErr => {
                if (putErr) console.error('Failed to upload email.ts:', putErr.message);
                else console.log('✅ Uploaded: src/lib/email.ts');
                
                // Upload lib/prisma.ts (with fixes)
                sftp.fastPut(
                    'd:/namasoft9-3-main/src/lib/prisma.ts',
                    '/www/wwwroot/n11.namainvist.com/src/lib/prisma.ts',
                    {},
                    putErr2 => {
                        if (putErr2) console.error('Failed to upload prisma.ts:', putErr2.message);
                        else console.log('✅ Uploaded: src/lib/prisma.ts');
                        
                        // Upload settings/company page
                        conn.exec(`mkdir -p "/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/settings/company"`, (e, stream) => {
                            stream.on('close', () => {
                                sftp.fastPut(
                                    'd:/namasoft9-3-main/src/app/(dashboard)/settings/company/page.tsx',
                                    '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/settings/company/page.tsx',
                                    {},
                                    putErr3 => {
                                        if (putErr3) console.error('Failed to upload settings/company:', putErr3.message);
                                        else console.log('✅ Uploaded: settings/company/page.tsx');
                                        
                                        // Now rebuild
                                        console.log('\n🔨 Rebuilding...');
                                        conn.exec(
                                            'cd /www/wwwroot/n11.namainvist.com && npm run build 2>&1 | tail -50 && pm2 restart saas-app && echo "✅ DONE"',
                                            (buildErr, buildStream) => {
                                                buildStream.on('data', d => process.stdout.write(d.toString()));
                                                buildStream.stderr.on('data', d => process.stderr.write(d.toString()));
                                                buildStream.on('close', () => { console.log('\n🎉 Complete!'); conn.end(); });
                                            }
                                        );
                                    }
                                );
                            });
                            stream.on('data', () => {});
                            stream.stderr.on('data', () => {});
                        });
                    }
                );
            }
        );
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
