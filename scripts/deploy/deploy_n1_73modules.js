const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    c.sftp((err, sftp) => {
        if (err) { console.error(err); c.end(); return; }
        
        console.log('Uploading 73-modules/page.tsx to n1.namainvist.com...');
        
        sftp.fastPut(
            'src/app/(dashboard)/reports/73-modules/page.tsx',
            '/www/wwwroot/n1.namainvist.com/src/app/(dashboard)/reports/73-modules/page.tsx',
            (err) => {
                if (err) { console.error('Upload failed:', err); c.end(); return; }
                console.log('Upload successful! Starting build...');
                
                // Clear .next, build, restart, and clear Nginx/LSCache
                const cmd = `
                    cd /www/wwwroot/n1.namainvist.com
                    rm -rf .next
                    npm run build
                    pm2 restart n1
                    rm -rf /usr/local/lsws/cachedata/* || true
                    rm -rf /www/server/nginx/proxy_cache_dir/* || true
                    nginx -s reload || true
                    lswsctrl restart || systemctl restart openlitespeed || true
                    echo "N1 DEPLOYMENT AND CACHE CLEAR COMPLETE!"
                `;
                
                c.exec(cmd, { env: { HOME: '/root', PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v22.0.0/bin' } }, (e, stream) => {
                    stream.on('data', d => process.stdout.write(d.toString()));
                    stream.stderr.on('data', d => process.stderr.write(d.toString()));
                    stream.on('close', () => {
                        console.log('✅ N1 deployment script finished!');
                        c.end();
                    });
                });
            }
        );
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
