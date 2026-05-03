const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 jlist', (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('data', d => data += d);
        stream.on('close', () => {
            const list = JSON.parse(data);
            list.forEach(p => console.log(`${p.name}: ${p.pm2_env.pm_cwd}`));
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
