const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('Sending TCP assassination protocol...');
    const cmd = `
        echo "Identifying phantom process on Port 3000..."
        fuser -k 3000/tcp || echo "No process found on 3000"
        
        echo "Restarting root gateway safely..."
        pm2 restart namainvist_root --update-env
        
        echo "Double checking PM2 health..."
        pm2 jlist | jq '.[] | select(.name == "namainvist_root") | {status: .pm2_env.status, restarts: .pm2_env.restart_time}'
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log(data.toString()))
              .stderr.on('data', data => console.error(data.toString()));
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
