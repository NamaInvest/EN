const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 jlist', (err, stream) => {
        let out = '';
        stream.on('data', d => out += d.toString()).on('close', () => {
            const list = JSON.parse(out);
            list.forEach(p => {
                console.log(`Name: ${p.name}, CWD: ${p.pm2_env.pm_cwd}`);
            });
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
