const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 jlist', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('close', () => {
            const list = JSON.parse(out);
            const app = list.find(l => l.name === 'nama-main');
            if (app) {
                console.log('CWD:', app.pm2_env.pm_cwd);
            } else {
                console.log('App not found. Found apps:', list.map(l => l.name).join(', '));
            }
            conn.end();
        }).on('data', data => out += data.toString());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
