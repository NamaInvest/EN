const { Client } = require('ssh2');
const config = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 60000 };

const conn = new Client();
conn.on('ready', () => {
    conn.exec('systemctl reload nginx || service nginx reload || nginx -s stop && nginx', (err, stream) => {
        if (err) throw err;
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.stderr.on('data', d => out += 'ERR:' + d.toString());
        stream.on('close', () => {
            console.log('NGINX:', out);
            conn.end();
        });
    });
}).on('error', console.error).connect(config);
