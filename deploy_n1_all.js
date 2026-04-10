const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    c.sftp((err, sftp) => {
        if (err) { console.error(err); c.end(); return; }
        
        console.log('Uploading all fixes to n1.namainvist.com (nama-main)...');
        
        const files = [
            ['src/lib/i18n.tsx', '/www/wwwroot/n1.namainvist.com/src/lib/i18n.tsx'],
            ['src/lib/translations.ts', '/www/wwwroot/n1.namainvist.com/src/lib/translations.ts'],
            ['src/app/(dashboard)/settings/page.tsx', '/www/wwwroot/n1.namainvist.com/src/app/(dashboard)/settings/page.tsx'],
            ['src/app/(dashboard)/reports/73-modules/page.tsx', '/www/wwwroot/n1.namainvist.com/src/app/(dashboard)/reports/73-modules/page.tsx']
        ];
        
        let count = 0;
        for (const [local, remote] of files) {
            sftp.fastPut(local, remote, (err) => {
                if (err) console.error('Upload failed:', local, err);
                else console.log('Uploaded:', local);
                
                count++;
                if (count === files.length) {
                    console.log('Starting build for nama-main...');
                    const cmd = `
                        cd /www/wwwroot/n1.namainvist.com
                        npm run build
                        pm2 restart nama-main
                        rm -rf /usr/local/lsws/cachedata/* || true
                        rm -rf /www/server/nginx/proxy_cache_dir/* || true
                        nginx -s reload || true
                        echo "N1 FIXED!"
                    `;
                    c.exec(cmd, { env: { HOME: '/root', PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v22.0.0/bin' } }, (e, stream) => {
                        stream.on('data', d => process.stdout.write(d.toString()));
                        stream.stderr.on('data', d => process.stderr.write(d.toString()));
                        stream.on('close', () => c.end());
                    });
                }
            });
        }
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
