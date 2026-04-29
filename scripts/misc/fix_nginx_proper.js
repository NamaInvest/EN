const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const script = `
# Unlock all nginx conf files that might have been locked by BT Panel
chattr -i /www/server/panel/vhost/nginx/*

# Check if node_n1.conf exists, if so rename to standard BT Panel format
if [ -f "/www/server/panel/vhost/nginx/node_n1.conf" ]; then
    mv /www/server/panel/vhost/nginx/node_n1.conf /www/server/panel/vhost/nginx/n1.namainvist.com.conf
fi

# Replace any proxy_pass 2999 with 3001 in n1's config
sed -i 's/proxy_pass http:\\/\\/127\\.0\\.0\\.1:[0-9]\\+;/proxy_pass http:\\/\\/127.0.0.1:3001;/g' /www/server/panel/vhost/nginx/n1.namainvist.com.conf

# Re-lock the file to protect it
chattr +i /www/server/panel/vhost/nginx/n1.namainvist.com.conf

# Reload Nginx securely
/etc/init.d/nginx reload
pm2 restart "nama-n1" || echo "PM2 restart skipped"
`;

    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
