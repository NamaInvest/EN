const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
    conn.exec('cd /www/wwwroot/n11.namainvist.com && rm -rf .next && npm run build && pm2 restart n11', (err, stream) => { 
        if (err) throw err; 
        stream.on('data', (d) => process.stdout.write(d)); 
        stream.stderr.on('data', (d) => process.stderr.write(d)); 
        stream.on('close', () => { conn.end(); process.exit(0); }); 
    }); 
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
