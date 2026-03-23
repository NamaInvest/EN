const { Client } = require('ssh2');

const server = { host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', name: 'N1' };

const conn = new Client();
conn.on('ready', () => {
    console.log(`[N1] Connected securely.`);
    conn.sftp((err, sftp) => {
        if (err) throw err;
        console.log(`[N1] Uploading new schema.prisma...`);
        sftp.fastPut('d:/namasoft9-3-main/prisma/schema.prisma', '/www/wwwroot/n1.namainvist.com/prisma/schema.prisma', (err) => {
            if (err) throw err;
            console.log(`[N1] Schema uploaded. Executing Prisma migration inside trusted network...`);
            conn.exec('cd /www/wwwroot/n1.namainvist.com && npx prisma db push --accept-data-loss', (err, stream) => {
                if (err) throw err;
                stream.on('data', d => process.stdout.write(d.toString()));
                stream.stderr.on('data', d => process.stderr.write(d.toString()));
                stream.on('close', () => {
                    console.log(`[N1] Database Push Complete! Generating types...`);
                    conn.exec('cd /www/wwwroot/n1.namainvist.com && npx prisma generate', (err, stream2) => {
                         stream2.on('data', d => process.stdout.write(d.toString()));
                         stream2.on('close', () => conn.end());
                    });
                });
            });
        });
    });
}).connect(server);
