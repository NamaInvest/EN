const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    const cmd = `
        cd /www/wwwroot/n11.namainvist.com
        echo "Clearing .next/cache..."
        rm -rf .next/cache
        echo "Rebuilding project..."
        npm run build
        echo "Restarting PM2..."
        pm2 restart nama-main || pm2 restart n11
        echo "Clearing server caches..."
        rm -rf /usr/local/lsws/cachedata/* || true
        rm -rf /www/server/nginx/proxy_cache_dir/* || true
        nginx -s reload || true
        echo "Done cleaning N11"
    `;

    c.exec(cmd, { env: { HOME: '/root', PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v22.0.0/bin' } }, (err, s) => {
        let o = '';
        s.on('data', d => o += d.toString());
        s.stderr.on('data', d => o += d.toString());
        s.on('close', () => {
            console.log("CLEAN OUTPUT:\n", o);
            c.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
