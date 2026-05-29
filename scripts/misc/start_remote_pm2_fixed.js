const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const targetDir = '/www/wwwroot/n1.namainvist.com';
const conn = new Client();

const nodeDir = '/root/.nvm/versions/node/v24.14.0/bin';

conn.on('ready', () => {
    console.log('Connected to ' + hostIp);
    const startCmd = `
        export PATH="${nodeDir}:$PATH"
        npm i -g pm2
        cd ${targetDir}
        pm2 delete n1 || true
        pm2 start npm --name "n1" -- start -- -p 3001
        pm2 save
    `;
    
    conn.exec(startCmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
            console.log('Started PM2 successfully.');
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err.message);
}).connect({ host: hostIp, port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', keepaliveInterval: 10000 });
