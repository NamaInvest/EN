const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const password = 'process.env.SSH_PASSWORD';

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to ' + hostIp);
    const cmd = `ls -lh /www/wwwroot | grep n1_backup && ls -lh /www/wwwroot | grep n1_db_backup`;
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write('ERR: ' + d));
        stream.on('close', () => {
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err.message);
}).connect({ host: hostIp, port: 22, username: 'root', password: password, keepaliveInterval: 10000 });
