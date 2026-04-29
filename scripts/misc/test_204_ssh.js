const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ SSH Connection to 204.168.144.74 SUCCESSFUL!');
    conn.exec('ls -la /www/wwwroot && pm2 jlist | jq ".[] | {name: .name, pwd: .pm2_env.pm_cwd}"', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log(data.toString()))
              .stderr.on('data', data => console.error(data.toString()));
    });
}).on('error', (err) => {
    console.error('❌ SSH Connection FAILED:', err.message);
}).connect({ host: '204.168.144.74', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000 });
