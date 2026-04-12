const { Client } = require('ssh2');

const bashCommand = `
pm2 delete n1-main n2-main n3-main n4-main n5-main n6-main n8-main n9-main n10-main nama-main || true
pm2 restart all
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d));
        stream.stderr.on('data', (d) => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
