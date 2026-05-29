const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- STARTING COMPREHENSIVE DIAGNOSTIC ---');
    const cmd = `
        echo "1. PM2 STATUS:"
        pm2 jlist | jq '.[] | {name: .name, status: .pm2_env.status, restart_time: .pm2_env.restart_time}'
        
        echo "\n2. NGINX PARSED SERVER NAMES:"
        nginx -T 2>/dev/null | grep -E "server_name.*namainvist"
        
        echo "\n3. LOCAL PM2 NEXT.JS HEALTH (Port 3000):"
        curl -I http://127.0.0.1:3000
        
        echo "\n4. LOCAL HTTPS HEALTH:"
        curl -kI https://127.0.0.1 --header "Host: namainvist.com"
        
        echo "\n5. NGINX ERROR LOG (Last 5 lines):"
        tail -n 5 /www/wwwlogs/namainvist.com.error.log 2>/dev/null || echo "No error log found"
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log(data.toString()))
              .stderr.on('data', data => console.error(data.toString()));
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
