const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('tar -tf /www/wwwroot/n4_backup_before_hotfix.tar.gz | grep Sidebar.tsx', (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 20000 });
