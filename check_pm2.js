const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to Cluster Node Array (46.4.188.170)');
    conn.exec('tail -n 30 /root/build_n1_phase84_hotfix.log && echo "--- PM2 STATUS ---" && pm2 status n1', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.end();
        }).on('data', (data) => {
            console.log(data.toString());
        }).stderr.on('data', (data) => {
            console.error(data.toString());
        });
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
