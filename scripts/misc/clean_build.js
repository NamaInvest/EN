const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
};

console.log('🔄 Rebuilding cleanly...');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cd /www/wwwroot/n11.namainvist.com && rm -rf .next && npm run build && pm2 restart n11', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end());
        stream.on('data', (d) => process.stdout.write(d.toString()));
        stream.stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).on('error', console.error).connect(config);
