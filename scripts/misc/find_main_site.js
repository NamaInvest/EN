const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 jlist', (err, stream) => {
        let output = '';
        stream.on('data', d => output += d.toString());
        stream.on('close', () => {
            const list = JSON.parse(output);
            const mainSite = list.find(l => l.name === 'main-site');
            console.log('main-site path:', mainSite ? mainSite.pm2_env.pm_cwd : 'NOT FOUND');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
