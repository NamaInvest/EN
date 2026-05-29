const { Client } = require('ssh2');

const server = { host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', name: 'N1' };

const conn = new Client();
conn.on('ready', () => {
    console.log(`Connected to ${server.name}`);
    conn.exec('tail -n 60 /root/.pm2/logs/n1-error.log /root/.pm2/logs/n1-out.log', (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).on('error', (err) => {
    console.error('Connection Error:', err);
}).connect(server);
