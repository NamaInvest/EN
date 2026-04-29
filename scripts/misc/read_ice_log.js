const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cat /tmp/provision_ice.log', (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d))
              .on('error', (d) => process.stderr.write(d))
              .on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
