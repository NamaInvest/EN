const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('fuser -k 3001/tcp || kill -9 $(lsof -t -i:3001) ; sleep 2 && pm2 restart nama-main', (err, stream) => {
        stream.on('data', d => process.stdout.write(d)).stderr.on('data', d => process.stderr.write(d)).on('close', () => {
            console.log('Done!');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
