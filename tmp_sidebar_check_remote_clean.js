const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cat /www/wwwroot/n2.namainvist.com/src/components/Sidebar.tsx', (err, stream) => {
        let out = "";
        stream.on('data', d => out += d);
        stream.on('close', () => {
             const lines = out.split('\n');
             console.log("Remote Sidebar.tsx lines 12-30:");
             for(let i=11; i<30; i++) {
                 console.log(i+1 + ": " + lines[i]);
             }
             conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
