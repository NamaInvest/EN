const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    console.log("Full clone N11 src to N1 and building...");
    const cmd = `
        cd /www/wwwroot/n1.namainvist.com
        rm -rf src
        cp -a /www/wwwroot/n11.namainvist.com/src /www/wwwroot/n1.namainvist.com/
        rm -rf .next
        npm run build > build_log.txt 2>&1
        pm2 restart nama-main
        rm -rf /usr/local/lsws/cachedata/* || true
        rm -rf /www/server/nginx/proxy_cache_dir/* || true
        nginx -s reload || true
        echo "N1 COMPLETELY RESTORED FROM N11!"
    `;
    c.exec(cmd, { env: { HOME: '/root', PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v22.0.0/bin' } }, (e, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => c.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
