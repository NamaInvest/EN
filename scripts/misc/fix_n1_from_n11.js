const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    console.log("Copying N11 src to N1 and building...");
    const cmd = `
        cp -af /www/wwwroot/n11.namainvist.com/src/locales /www/wwwroot/n1.namainvist.com/src/ 2>/dev/null || true
        cp -af /www/wwwroot/n11.namainvist.com/src/lib/translations.ts /www/wwwroot/n1.namainvist.com/src/lib/
        cp -af /www/wwwroot/n11.namainvist.com/src/lib/i18n.tsx /www/wwwroot/n1.namainvist.com/src/lib/
        cp -af /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/settings/page.tsx /www/wwwroot/n1.namainvist.com/src/app/\\(dashboard\\)/settings/ || true
        cp -af /www/wwwroot/n11.namainvist.com/src/app/\\(dashboard\\)/reports/73-modules/page.tsx /www/wwwroot/n1.namainvist.com/src/app/\\(dashboard\\)/reports/73-modules/ || true
        cp -af /www/wwwroot/n11.namainvist.com/src/app/restaurant-pos/page.tsx /www/wwwroot/n1.namainvist.com/src/app/restaurant-pos/ || true
        
        cd /www/wwwroot/n1.namainvist.com
        rm -rf .next
        npm run build > build_log.txt 2>&1
        pm2 restart nama-main
        rm -rf /www/server/nginx/proxy_cache_dir/* || true
        nginx -s reload || true
        echo "N1 RESTORED FROM N11!"
    `;
    c.exec(cmd, { env: { HOME: '/root', PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v22.0.0/bin' } }, (e, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => c.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
