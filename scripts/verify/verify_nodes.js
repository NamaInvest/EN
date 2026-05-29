const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('--- VERIFYING ALL CLUSTER NODES ---');
    conn.exec('pm2 jlist | jq "\\"[PM2 STATUS]\\" + (.[] | \\"Node: \\" + .name + \\" | Status: \\" + .pm2_env.status + \\" | Port: \\" + (.pm2_env.env.PORT | tostring))"', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log(data.toString()))
              .stderr.on('data', data => console.error(data.toString()));
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
