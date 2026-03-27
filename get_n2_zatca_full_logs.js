const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('tail -n 150 /root/.pm2/logs/n2-out.log && echo "===ERROR LOG===" && tail -n 150 /root/.pm2/logs/n2-error.log', (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('close', () => {
            console.log(output);
            conn.end();
        }).on('data', data => output += data.toString());
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
