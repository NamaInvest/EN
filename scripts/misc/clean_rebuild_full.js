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
                if (count === files.length) cleanAndBuild();
            });
        }

        function cleanAndBuild() {
            console.log('\nCleaning .next cache completely...');
            // Remove entire .next directory to force clean build
            c.exec([
                'rm -rf /www/wwwroot/n11.namainvist.com/.next',
                'echo "Cache cleared"',
                'cd /www/wwwroot/n11.namainvist.com',
                'npm run build',
                'pm2 restart n11',
                'echo "CLEAN_BUILD_COMPLETE"'
            ].join(' && '), { 
                env: { HOME: '/root', PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v22.0.0/bin' }
            }, (e, stream) => {
                if (e) { console.error(e); c.end(); return; }
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => { console.log('\n✅ Done!'); c.end(); });
            });
        }
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
