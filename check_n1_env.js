const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
    conn.exec('cat /www/wwwroot/n1.namainvist.com/.env', (err, stream) => { 
        if (err) throw err; 
        stream.on('data', (d) => process.stdout.write(d)); 
        stream.stderr.on('data', (d) => process.stderr.write(d)); 
        stream.on('close', () => { conn.end(); process.exit(0); }); 
    }); 
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
