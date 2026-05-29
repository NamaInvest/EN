const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    conn.exec(`
        # Remove CacheBuster from layout
        sed -i '/import CacheBuster/d' /www/wwwroot/n2.namainvist.com/src/app/\\(dashboard\\)/layout.tsx
        sed -i 's/<CacheBuster \\/>//g' /www/wwwroot/n2.namainvist.com/src/app/\\(dashboard\\)/layout.tsx
        
        # Build and restart
        cd /www/wwwroot/n2.namainvist.com && /usr/bin/npm run build
        pm2 restart n2-main
    `, (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stdout.write(d));
        stream.on('close', () => {
            console.log('Cleanup and Build DONE on N2!');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
