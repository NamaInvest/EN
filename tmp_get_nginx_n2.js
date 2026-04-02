const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cat /www/server/panel/vhost/nginx/n2.namainvist.com.conf', (err, stream) => {
        let out = "";
        stream.on('data', d => out += d);
        stream.on('close', () => {
             const fs = require('fs');
             fs.writeFileSync('d:\\namasoft9-3-main\\tmp_nginx_n2.txt', out);
             console.log("Saved to tmp_nginx_n2.txt");
             conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
