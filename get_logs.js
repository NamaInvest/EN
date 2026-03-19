const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
    conn.exec('bash -lc "pm2 logs n1 --lines 50 --nostream"', (err, stream) => { 
        stream.on('data', d => console.log(d.toString())); 
        stream.stderr.on('data', d => console.error(d.toString())); 
        stream.on('close', () => conn.end()); 
    }); 
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
