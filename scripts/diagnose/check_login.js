const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = [
        'cat /www/wwwroot/namainvest.namainvist.com/.env | grep -E "DATABASE_URL|PORT|JWT"',
        'echo ---',
        'curl -s -X POST https://namainvest.namainvist.com/api/auth/login -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin"}\''
    ].join(' && ');

    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
