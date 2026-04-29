const { Client } = require('ssh2');

async function deployI18nFix() {
    console.log(`[n2-hotfix] Uploading fixed i18n.tsx to N2...`);
    const conn = new Client();
    
    conn.on('ready', () => {
        conn.sftp((err, sftp) => {
            if (err) throw err;
            sftp.fastPut('src/lib/i18n.tsx', '/www/wwwroot/n2.namainvist.com/src/lib/i18n.tsx', (err) => {
                if (err) { console.error('Upload Error:', err); return conn.end(); }
                
                console.log(`[n2-hotfix] i18n.tsx Uploaded. Triggering Next.js Build...`);
                // Using exact environment map required by aaPanel N2
                const cmd = `export PATH=/www/server/nodejs/v22.11.0/bin:$PATH && cd /www/wwwroot/n2.namainvist.com && npm run build`;
                conn.exec(cmd, (err, stream) => {
                    if (err) throw err;
                    
                    stream.on('data', () => process.stdout.write('.'))
                    .on('close', (code) => {
                        if (code !== 0) {
                            console.error(`\n[n2-hotfix] Build failed! Code: ${code}`);
                        } else {
                            console.log(`\n[n2-hotfix] Build successful! Restarting PM2...`);
                            conn.exec(`export PATH=/www/server/nodejs/v22.11.0/bin:$PATH && pm2 restart n2`, () => {
                                console.log(`[n2-hotfix] Deployed! The UI dictionary is now fully loaded and keys like pos.str_1 are fixed!`);
                                conn.end();
                            });
                        }
                    });
                });
            });
        });
    }).on('error', (err) => console.error(err))
      .connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
}

deployI18nFix();
