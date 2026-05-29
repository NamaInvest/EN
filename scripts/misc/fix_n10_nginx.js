const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const cmd = `
        echo "Removing overlapping server_name from n10.namainvist.com.conf..."
        sed -i 's/server_name n10.namainvist.com www.namainvist.com;/server_name n10.namainvist.com;/g' /www/server/panel/vhost/nginx/n10.namainvist.com.conf
        sed -i 's/server_name n10.namainvist.com namainvist.com;/server_name n10.namainvist.com;/g' /www/server/panel/vhost/nginx/n10.namainvist.com.conf
        nginx -t && nginx -s reload && echo "✅ N10 OVERLAP REMOVED. SSL ROUTING FIXED."
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => console.log(data.toString()))
              .stderr.on('data', data => console.error(data.toString()));
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD' });
