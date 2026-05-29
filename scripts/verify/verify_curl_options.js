const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
    conn.exec('curl -s http://127.0.0.1:3011/sales/options | grep -i "شاملة الضريبة"', (err, stream) => { 
        if (err) throw err; 
        stream.on('data', (d) => process.stdout.write(d)); 
        stream.stderr.on('data', (d) => process.stderr.write(d)); 
        stream.on('close', () => { conn.end(); process.exit(0); }); 
    }); 
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
