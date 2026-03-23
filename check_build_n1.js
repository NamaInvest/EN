const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to N1. Fetching build_api.log...');
    conn.exec('tail -n 100 /www/wwwroot/n1.namainvist.com/build_api.log', (err, stream) => {
        if (err) throw err;
        stream.on('data', data => process.stdout.write(data.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', err => console.error('SSH Error:', err)).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000
});
