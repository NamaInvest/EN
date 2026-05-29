const { Client } = require('ssh2');

const c = new Client();
c.on('ready', () => {
    const cmd = `
        cd /www/wwwroot/n1.namainvist.com
        npm run build > build_log.txt 2>&1
        pm2 restart nama-main
        echo "BUILD FINISHED"
        pm2 logs nama-main --lines 20 --nostream
    `;
    c.exec(cmd, { env: { HOME: '/root', PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v22.0.0/bin' } }, (e, stream) => {
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => c.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
