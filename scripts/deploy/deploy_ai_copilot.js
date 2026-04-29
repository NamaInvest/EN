const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    c.sftp((err, sftp) => {
        if (err) { console.error(err); c.end(); return; }
        
        console.log('Uploading route.ts to n11.namainvist.com...');
        
        sftp.fastPut(
            'src/app/api/ai/copilot/route.ts',
            '/www/wwwroot/n11.namainvist.com/src/app/api/ai/copilot/route.ts',
            (err) => {
                if (err) { console.error('Upload failed:', err); c.end(); return; }
                console.log('Uploaded successfully. Starting fast Turbopack rebuild for n11...');
                
                const cmd = `
                    cd /www/wwwroot/n11.namainvist.com
                    npm run build
                    pm2 restart nama-main
                    rm -rf /usr/local/lsws/cachedata/* || true
                    rm -rf /www/server/nginx/proxy_cache_dir/* || true
                    nginx -s reload || true
                    echo "N11 AI ROUTE DEPLOYED!"
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
