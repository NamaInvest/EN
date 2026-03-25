const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- CHECKING PM2 AUTOMATION DAEMONS ---');
    conn.exec('pm2 jlist | jq ".[] | {name: .name, status: .pm2_env.status}"', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log(data.toString()))
              .stderr.on('data', data => console.error(data.toString()));
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
