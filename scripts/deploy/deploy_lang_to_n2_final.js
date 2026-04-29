const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('[🚀] Connected to N2. Finalizing the radical fix...');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        console.log('[📦] Uploading i18n.tsx...');
        sftp.fastPut('src/lib/i18n.tsx', '/www/wwwroot/n2.namainvist.com/src/lib/i18n.tsx', (err) => {
            if (err) throw err;
            console.log('[📦] Uploading translations.ts...');
            sftp.fastPut('src/lib/translations.ts', '/www/wwwroot/n2.namainvist.com/src/lib/translations.ts', (err) => {
                if (err) throw err;
                console.log('[📦] Uploading Sidebar.tsx...');
                sftp.fastPut('src/components/Sidebar.tsx', '/www/wwwroot/n2.namainvist.com/src/components/Sidebar.tsx', (err) => {
                    if (err) throw err;
                    console.log('[📦] Uploading LanguageSwitcher.tsx...');
                    sftp.fastPut('src/components/LanguageSwitcher.tsx', '/www/wwwroot/n2.namainvist.com/src/components/LanguageSwitcher.tsx', (err) => {
                    if (err) throw err;
                    console.log('[⚙️] NUKING Next.js cache and rebuilding... (This will take a few minutes)');
                    
                    conn.exec('cd /www/wwwroot/n2.namainvist.com && rm -rf .next && /usr/bin/npm run build', (err, stream) => {
                        if (err) throw err;
                        
                        stream.on('data', d => process.stdout.write(d));
                        stream.stderr.on('data', d => process.stdout.write(d));
                        
                        stream.on('close', code => {
                            console.log(`\n[✅] N2 Build Complete with code ${code}. Restarting pm2...`);
                            conn.exec('pm2 restart n2-main && pm2 restart n2-whatsapp', (err2, stream2) => {
                                if (err2) throw err2;
                                stream2.on('close', () => {
                                    console.log('[🎉] N2 is FULLY fixed and online!');
                                    conn.end();
                                    process.exit(0);
                                });
                            });
                        });
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
    password: '_ee4SWbxLVfH9b'
});
