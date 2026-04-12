const { Client } = require('ssh2');
const bashCommand = `
pm2 delete ice || true
cd /www/wwwroot/ice.namainvist.com
pm2 start npm --name "ice" --cwd "/www/wwwroot/ice.namainvist.com" -- start -- -p 3012
pm2 save
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(bashCommand, (err, stream) => {
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
