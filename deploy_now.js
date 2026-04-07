const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('[🚀] Connected to N2...');
    conn.sftp((err, sftp) => {
        if (err) throw err;

        const files = [
            ['src/lib/i18n.tsx', '/www/wwwroot/n2.namainvist.com/src/lib/i18n.tsx'],
            ['src/components/Sidebar.tsx', '/www/wwwroot/n2.namainvist.com/src/components/Sidebar.tsx'],
            ['src/components/LanguageSwitcher.tsx', '/www/wwwroot/n2.namainvist.com/src/components/LanguageSwitcher.tsx'],
        ];

        let i = 0;
        const uploadNext = () => {
            if (i >= files.length) {
                // All uploaded, now build
                console.log('[⚙️] Files uploaded. Rebuilding...');
                conn.exec('cd /www/wwwroot/n2.namainvist.com && rm -rf .next && /usr/bin/npm run build', (err, stream) => {
                    if (err) throw err;
                    stream.on('data', d => process.stdout.write(d));
                    stream.stderr.on('data', d => process.stdout.write(d));
                    stream.on('close', code => {
                        console.log(`\n[${code === 0 ? '✅' : '❌'}] Build code: ${code}`);
                        conn.exec('pm2 restart n2-main 2>&1', (err2, stream2) => {
                            if (err2) { console.error(err2); conn.end(); return; }
                            stream2.on('data', d => process.stdout.write(d));
                            stream2.on('close', () => {
                                console.log('[🎉] N2 restarted!');
                                conn.end();
                            });
                        });
                    });
                });
                return;
            }
            const [local, remote] = files[i++];
            console.log(`[📦] Uploading ${local}...`);
            sftp.fastPut(local, remote, uploadErr => {
                if (uploadErr) {
                    console.error(`[❌] Failed to upload ${local}:`, uploadErr.message);
                    // Continue even on error
                }
                uploadNext();
            });
        };
        uploadNext();
    });
}).on('error', err => {
    console.error('SSH Error:', err.message);
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000,
});
