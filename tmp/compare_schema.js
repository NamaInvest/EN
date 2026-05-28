const { Client } = require('ssh2');
const fs = require('fs');

const SERVER = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: '_ee4SWbxLVfH9b'
};

const conn = new Client();

conn.on('ready', () => {
    conn.exec('cat /www/wwwroot/namainvist.com/prisma/schema.prisma', (err, stream) => {
        if (err) throw err;
        let content = '';
        stream.on('data', d => { content += d.toString(); });
        stream.on('close', () => {
            fs.writeFileSync('tmp/server_schema.prisma', content);
            console.log('Successfully saved server schema to tmp/server_schema.prisma');
            conn.end();
        });
    });
}).connect(SERVER);
