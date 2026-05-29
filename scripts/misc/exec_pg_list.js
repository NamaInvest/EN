const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const fs = require('fs');
        const readStream = fs.createReadStream('list_pg_dbs.js');
        const writeStream = sftp.createWriteStream('/root/list_pg_dbs.js');
        writeStream.on('close', () => {
            conn.exec('node /root/list_pg_dbs.js', (err, stream) => { 
                if (err) throw err; 
                stream.on('data', (d) => process.stdout.write(d)); 
                stream.stderr.on('data', (d) => process.stderr.write(d)); 
                stream.on('close', () => { conn.end(); process.exit(0); }); 
            }); 
        });
        readStream.pipe(writeStream);
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
