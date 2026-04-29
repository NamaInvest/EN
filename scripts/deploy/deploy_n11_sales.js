const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    c.sftp((err, sftp) => {
        if (err) { console.error(err); c.end(); return; }
        
        console.log('Uploading sales/page.tsx to n11.namainvist.com...');
        
        sftp.fastPut(
            'src/app/(dashboard)/sales/page.tsx',
            '/www/wwwroot/n11.namainvist.com/src/app/(dashboard)/sales/page.tsx',
            (err) => {
                if (err) { console.error('Upload failed:', err); c.end(); return; }
                console.log('Uploaded successfully. Starting fast Turbopack rebuild for n11...');
                
                const cmd = `
                    set -e
                    cd /www/wwwroot/n11.namainvist.com
                    npm run build
                    pm2 restart n11
                    rm -rf /usr/local/lsws/cachedata/* || true
                    rm -rf /www/server/nginx/proxy_cache_dir/* || true
                    nginx -s reload || true
                    echo "N11 SALES PAGE DEPLOYED!"
                `;
                c.exec(cmd, { env: { HOME: '/root', PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v22.0.0/bin' } }, (e, stream) => {
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                    stream.on('close', () => c.end());
                });
            }
        );
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
