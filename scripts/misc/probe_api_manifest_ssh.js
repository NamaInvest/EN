const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('ls -la /www/wwwroot/n1.namainvist.com/src/app/api/manifest/route.ts && cat /www/wwwroot/n1.namainvist.com/src/app/api/manifest/route.ts', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => { conn.end(); process.exit(); })
        .on('data', d => console.log(d.toString()))
        .stderr.on('data', d => console.error(d.toString()));
    });
}).connect({host:'46.4.188.170', port:22, username:'root', password:'_ee4SWbxLVfH9b'});
