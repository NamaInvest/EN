const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- MONITORING DETACHED BUILD STREAM (204.x) ---');
    
    const cmd = `
        cd /var/www/namasoft
        tail -n 25 build_phase88_final.log
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log(data.toString()))
              .stderr.on('data', data => console.error(data.toString()));
    });
}).on('error', (err) => {
    console.error('SSH Connection Failed:', err.message);
}).connect({
    host: '204.168.144.74', 
    port: 22, 
    username: 'root', 
    privateKey: fs.readFileSync('C:\\Users\\1\\Desktop\\namasoftkey\\namasoft_key'),
    readyTimeout: 10000
});
