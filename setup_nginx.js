const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const conn = new Client();

const nginxConfig = `
server {
    listen 80;
    server_name n1.namainvist.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_cache_bypass \\$http_upgrade;
    }
}
`;

const cmd = `
echo "${nginxConfig}" > /etc/nginx/sites-available/n1.namainvist.com
ln -sf /etc/nginx/sites-available/n1.namainvist.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
`;

conn.on('ready', () => {
    console.log('Connected to ' + hostIp);
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', (code) => {
            console.log('Nginx configured successfully with proxy to 3001.');
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err.message);
}).connect({ host: hostIp, port: 22, username: 'root', password: '_ee4SWbxLVfH9b', keepaliveInterval: 10000 });
