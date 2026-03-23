const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        console.log("Uploading schema.prisma to N1...");
        sftp.fastPut('d:/namasoft9-3-main/prisma/schema.prisma', '/www/wwwroot/n1.namainvist.com/prisma/schema.prisma', (err) => {
            if (err) throw err;
            console.log("Upload successful! Executing remote migrate...");
            conn.exec('cd /www/wwwroot/n1.namainvist.com && npx prisma db push && npx prisma generate', (err, stream) => {
                if (err) throw err;
                stream.on('data', data => process.stdout.write(data.toString()));
                stream.on('close', () => {
                    console.log('Migration finished!');
                    conn.end();
                });
            });
        });
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 10000
});
