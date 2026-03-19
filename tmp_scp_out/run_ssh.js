const { Client } = require('ssh2');
const hostIp = '46.4.188.170';
const cmd = process.argv[2];

const conn = new Client();
conn.on('ready', () => {
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
            process.exit(code);
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect({
    host: hostIp, port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000
});
