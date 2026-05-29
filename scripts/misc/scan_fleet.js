const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- RECONNAISSANCE OF SaaS FLEET (N1-N10) ---');
    
    conn.exec('ls -la /www/wwwroot/', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('\n✅ SCAN COMPLETE.');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
