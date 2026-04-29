const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- FETCHING PM2 CRASH TRACES ON 204.x ---');
    
    const cmd = `
        echo "=== PM2 STATUS ==="
        pm2 jlist | jq '.[] | {name: .name, status: .pm2_env.status, port: .pm2_env.env.PORT}'
        
        echo "\\n=== RECENT PM2 LOGS (ERROR) ==="
        pm2 logs namasoft --err --lines 20 --nostream
        
        echo "\\n=== RECENT PM2 LOGS (OUT) ==="
        pm2 logs namasoft --out --lines 20 --nostream
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
