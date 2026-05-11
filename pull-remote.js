const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('✅ Connected to Hetzner Production.');
    // Try to pull git, if not a git repo or fails, we will upload via SFTP
    const cmd = `cd /www/wwwroot/namainvist.com && git pull origin main && npm run build && pm2 restart ecosystem.config.js`;
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
