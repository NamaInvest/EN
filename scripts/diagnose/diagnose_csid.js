const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    // Just fetch the last 150 lines from both error and out logs
    conn.exec('tail -n 150 ~/.pm2/logs/n1-error*.log ~/.pm2/logs/n1-out*.log', (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('data', d => data += d);
        stream.on('close', () => {
            console.log("----- PM2 TAIL -----");
            console.log(data);
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
