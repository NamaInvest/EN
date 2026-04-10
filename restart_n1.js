const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    // Clear cache AND restart nama-main
    const cmd = `
        pm2 restart nama-main
        rm -rf /usr/local/lsws/cachedata/* || true
        rm -rf /www/server/nginx/proxy_cache_dir/* || true
        nginx -s reload || true
        systemctl restart openlitespeed || true
        echo "N1 COMPLETELY RESTARTED!"
    `;
    c.exec(cmd, { env: { HOME: '/root', PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v22.0.0/bin' } }, (e, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => c.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 30000 });
