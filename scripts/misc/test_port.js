const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = [
        // Direct test to port 3013
        'curl -s -X POST http://127.0.0.1:3013/api/auth/login -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin"}\'',
        'echo ---',
        // Check which process is on port 3013
        'ss -tlnp | grep 3013',
        'echo ---',
        // Check nginx routing - what port is handling namainvest
        'curl -sk -H "Host: namainvest.namainvist.com" http://127.0.0.1/api/auth/login -X POST -H "Content-Type: application/json" -d \'{"username":"admin","password":"admin"}\'',
    ].join(' && ');
    conn.exec(cmd, (err, s) => {
        s.on('data', d => process.stdout.write(d.toString()));
        s.stderr.on('data', d => process.stderr.write(d.toString()));
        s.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
