const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const targetDir = '/www/wwwroot/n1.namainvist.com';
const conn = new Client();

conn.on('ready', () => {
    console.log('Connected to ' + hostIp);
    const startCmd = `
        export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh" && nvm use 24
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
}).connect({ host: hostIp, port: 22, username: 'root', password: '_ee4SWbxLVfH9b', keepaliveInterval: 10000 });
