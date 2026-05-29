const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        console.log("Downloading schema.prisma from N1 via ssh2...");
        sftp.fastGet('/www/wwwroot/n1.namainvist.com/prisma/schema.prisma', 'c:/Users/1/Desktop/alfa/prisma/schema.prisma', (err) => {
            if (err) throw err;
            console.log("Download successful!");
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 10000
});
