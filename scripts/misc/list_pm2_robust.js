const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 jlist', (err, stream) => {
        let out = '';
        stream.on('data', d => out += d.toString()).on('close', () => {
            const list = JSON.parse(out);
            list.forEach(p => console.log(`${p.pm_id} | ${p.name} | ${p.pm2_env.status} | restarts: ${p.pm2_env.restart_time}`));
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
