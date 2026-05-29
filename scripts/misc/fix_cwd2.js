const { Client } = require('ssh2');
const conn = new Client();
const MASTER = '/www/wwwroot/n11.namainvist.com';
const PORT = 3500;

conn.on('ready', () => {
    const cmd = `
pm2 delete saas-app 2>/dev/null || true
cd ${MASTER}
pm2 start node_modules/next/dist/bin/next --name saas-app -- start -p ${PORT}
pm2 save --force
sleep 8
pm2 logs saas-app --lines 20 --nostream 2>/dev/null
pm2 list | grep saas
`;
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 40000 });
