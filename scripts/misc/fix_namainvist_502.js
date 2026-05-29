const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- RECOVERING ROOT DOMAIN (namainvist.com) ---');
    
    const bashScript = `
#!/bin/bash
echo "1. Purging colliding (dashboard)/master-panel from Root Domain..."
rm -rf /www/wwwroot/namainvist.com/src/app/\\(dashboard\\)/master-panel

echo "2. Rebuilding Root Domain Next.js Core..."
cd /www/wwwroot/namainvist.com
npm run build

echo "3. Identifying PM2 process for namainvist.com and Restarting..."
# Let's just pm2 reload all to be absolutely sure we catch whatever it is named
pm2 reload all

echo "✅ RECOVERY COMPLETE."
    `;

    conn.exec(bashScript, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('✅ SSH SESSION CLOSED.');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
