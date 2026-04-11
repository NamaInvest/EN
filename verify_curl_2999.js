const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

const cmd = `curl -s http://127.0.0.1:2999 | grep "73" -C 5`; // Looking for the text "73" which I put in Variant 5

const conn = new Client();
conn.on('ready', () => {
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end());
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).on('error', console.error).connect(config);
