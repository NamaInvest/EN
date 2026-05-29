const { Client } = require('ssh2');
const fs = require('fs');

const c = new Client();
c.on('ready', () => {
    c.sftp((err, sftp) => {
        if (err) { console.error(err); c.end(); return; }

        const files = [
            ['src/lib/translations.ts', '/www/wwwroot/n11.namainvist.com/src/lib/translations.ts'],
            ['src/lib/i18n.tsx', '/www/wwwroot/n11.namainvist.com/src/lib/i18n.tsx'],
            ['src/app/(dashboard)/settings/page.tsx', '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/settings/page.tsx'],
        ];

        let count = 0;
        for (const [local, remote] of files) {
            sftp.fastPut(local, remote, (err) => {
                if (err) console.error('❌ Failed:', local, err.message);
                else console.log('✅ Uploaded:', local);
                count++;
                if (count === files.length) startBuild();
            });
        }

        function startBuild() {
            console.log('\nVerifying server files...');
            c.exec("head -3 /www/wwwroot/n11.namainvist.com/src/lib/translations.ts", (e, s) => {
                let out = '';
                s.on('data', d => { out += d.toString(); });
                s.on('close', () => {
                    console.log('Server translations.ts first 3 lines:', out);
                    console.log('\nStarting build...');
                    c.exec('cd /www/wwwroot/n11.namainvist.com && npm run build && pm2 restart n11 && echo "BUILD_COMPLETE"', (e2, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.stderr.on('data', d => process.stderr.write(d.toString()));
                        stream.on('close', () => { console.log('\n✅ All done!'); c.end(); });
                    });
                });
            });
        }
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
