const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
};

const cmd = `
ps -f -p 37410
ls -l /proc/37410/exe
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', d => process.stdout.write(d.toString()))
              .stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).on('error', console.error).connect(config);
