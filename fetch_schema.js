const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        console.log("Downloading schema.prisma from N1 via ssh2...");
        sftp.fastGet('/www/wwwroot/n1.namainvist.com/prisma/schema.prisma', 'd:/namasoft9-3-main/prisma/schema.prisma', (err) => {
            if (err) throw err;
            console.log("Download successful!");
            conn.end();
        });
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000
});
