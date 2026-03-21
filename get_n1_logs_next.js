const { Client } = require('ssh2');

function getLogs() {
    const conn = new Client();
    conn.on('ready', () => {
        conn.exec('cat /root/.pm2/logs/n1-error.log | tail -n 50', (err, stream) => {
            if (err) throw err;
            stream.on('close', () => conn.end());
            stream.on('data', data => console.log(data.toString()));
            stream.stderr.on('data', data => console.error('STDERR:', data.toString()));
        });
    }).on('error', err => console.error(err)).connect({
        host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'
    });
}
getLogs();
