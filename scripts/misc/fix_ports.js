const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- EXECUTING EMERGENCY PORT ISOLATION ---');
    
    const cmd = `
        echo "1. Correcting N1 proxy to its original Port 3000..."
        sed -i 's/127.0.0.1:3001/127.0.0.1:3000/g' /www/server/panel/vhost/nginx/node_n1.conf 2>/dev/null || true
        sed -i 's/127.0.0.1:3001/127.0.0.1:3000/g' /www/server/panel/vhost/nginx/n1.namainvist.com.conf 2>/dev/null || true
        
        echo "2. Evicting Root Domain to isolated Port 3005..."
        chattr -i /www/server/panel/vhost/nginx/namainvist.com.conf 2>/dev/null
        sed -i 's/127.0.0.1:3000/127.0.0.1:3005/g' /www/server/panel/vhost/nginx/namainvist.com.conf 2>/dev/null
        chattr +i /www/server/panel/vhost/nginx/namainvist.com.conf 2>/dev/null
        
        echo "3. Routing SSL and NGINX Traffic..."
        nginx -t && nginx -s reload
        
        echo "4. Hard-Rebooting PM2 compute cores separately..."
        # Kill the phantom process that caused EADDRINUSE on 3000
        fuser -k 3000/tcp 2>/dev/null || true
        fuser -k 3005/tcp 2>/dev/null || true
        
        cd /www/wwwroot/n1.namainvist.com && PORT=3000 pm2 restart n1 --update-env
        cd /www/wwwroot/namainvist.com && PORT=3005 pm2 restart namainvist_root --update-env
        
        echo "5. Verifying PM2 telemetry..."
        pm2 jlist | jq '.[] | select(.name=="namainvist_root" or .name=="n1") | {name: .name, status: .pm2_env.status, port: .pm2_env.env.PORT}'
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log(data.toString()))
              .stderr.on('data', data => console.error(data.toString()));
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
