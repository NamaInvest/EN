const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const conn = new Client();

conn.on('ready', () => {
    console.log('Connected');
    conn.exec('pwd', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => console.log('OUT:', d.toString()));
        stream.stderr.on('data', d => console.error('ERR:', d.toString()));
        stream.on('close', (code) => {
            console.log('Exit code:', code);
            conn.end();
        });
    });
}).connect({
    host: hostIp, port: 22, username: 'root', password: 'VmJUML2LuezRSws', keepaliveInterval: 10000
});
