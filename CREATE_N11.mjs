import { Client } from 'ssh2';

const conn = new Client();
console.log('🚀 Connecting to Fleet Master Node (46.4.188.170)...');

conn.on('ready', () => {
    console.log('✅ Connected! Initiating deep clone of N1 to N11...');
    
    const bashScript = `
#!/bin/bash
set -e

echo "1. Synchronizing files from n1.namainvist.com to n11.namainvist.com..."
mkdir -p /www/wwwroot/n11.namainvist.com
rsync -a --delete /www/wwwroot/n1.namainvist.com/ /www/wwwroot/n11.namainvist.com/

echo "2. Setting up Nginx Routing for n11..."
if [ -f /www/server/panel/vhost/nginx/n10.namainvist.com.conf ]; then
    cp /www/server/panel/vhost/nginx/n10.namainvist.com.conf /www/server/panel/vhost/nginx/n11.namainvist.com.conf
    # Replace n10 with n11
    sed -i 's/n10\\.namainvist\\.com/n11.namainvist.com/g' /www/server/panel/vhost/nginx/n11.namainvist.com.conf
    sed -i 's/n10\\.err/n11.err/g' /www/server/panel/vhost/nginx/n11.namainvist.com.conf
    sed -i 's/n10\\.log/n11.log/g' /www/server/panel/vhost/nginx/n11.namainvist.com.conf
    # Increment proxy port from 3010 to 3011
    sed -i 's/3010/3011/g' /www/server/panel/vhost/nginx/n11.namainvist.com.conf
    systemctl reload nginx || /etc/init.d/nginx reload
    echo "Nginx routing established on port 3011."
else
    echo "⚠️ Could not find n10 Nginx template. You may need to create the site n11.namainvist.com manually in aaPanel and proxy it to port 3011."
fi

echo "3. Starting isolated PM2 process for n11 on port 3011..."
cd /www/wwwroot/n11.namainvist.com
pm2 delete n11 2>/dev/null || true
pm2 start npm --name "n11" -- run start -- -p 3011
pm2 save

echo "🎉 CLONE COMPLETE! n11.namainvist.com is now running independently on port 3011."
    `;

    conn.exec(bashScript, (err, stream) => {
        if (err) {
            console.error('Remote execution failed:', err);
            conn.end();
            return;
        }
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', (code) => {
            console.log(`\n✅ Remote script finished with exit code ${code}`);
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('❌ Connection error:', err);
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 30000 });
