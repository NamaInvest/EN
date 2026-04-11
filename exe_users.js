const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const readStream = fs.createReadStream('test_users.js');
        const writeStream = sftp.createWriteStream('/www/wwwroot/n11.namainvist.com/test_users.js');
        
        writeStream.on('close', () => {
            conn.exec('cd /www/wwwroot/n11.namainvist.com && node test_users.js', (err, stream) => {
                if (err) throw err;
                stream.on('data', (d) => process.stdout.write(d));
                stream.stderr.on('data', (d) => process.stderr.write(d));
                stream.on('close', () => {
                    conn.end();
                    process.exit(0);
                });
            });
        });
        
        readStream.pipe(writeStream);
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
});
