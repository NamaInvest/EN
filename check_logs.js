const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
    conn.exec('ls -la /www/wwwroot/n1.namainvist.com/.next && cat /root/build_n.log', (err, stream) => { 
        if (err) throw err; 
        let out=''; 
        stream.on('close', () => {console.log(out); conn.end()}).on('data', d => out+=d).stderr.on('data', d => out+=d); 
    }); 
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 20000});
