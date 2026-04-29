const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH connection successful!');
    conn.exec('pm2 status', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log('STDOUT: ' + data))
              .stderr.on('data', data => console.error('STDERR: ' + data));
    });
}).on('error', (err) => {
    console.error('SSH Error: ' + err.message);
}).connect({
    host: '204.168.144.74',
    port: 22,
    username: 'root',
    password: 'VmJUML2LuezRSws',
    readyTimeout: 10000
});
