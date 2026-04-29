const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
conn.on('ready', () => {
    // Save nginx config to temp file, then download it
    conn.exec('cat /www/server/panel/vhost/nginx/n3.namainvist.com.conf', (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        let out = '';
        stream.on('data', d => out += d.toString());
        stream.on('close', () => {
            fs.writeFileSync('n3_nginx.conf', out);
            console.log('Saved nginx config to n3_nginx.conf (' + out.length + ' bytes)');
            
            // Now get the reverse proxy config too
            conn.exec('cat /www/server/panel/vhost/nginx/proxy/n3.namainvist.com/*.conf 2>/dev/null; echo "=== REWRITE ==="; cat /www/server/panel/vhost/rewrite/n3.namainvist.com.conf 2>/dev/null', (err, stream2) => {
                if (err) { conn.end(); return; }
                let out2 = '';
                stream2.on('data', d => out2 += d.toString());
                stream2.on('close', () => {
                    fs.writeFileSync('n3_proxy.conf', out2);
                    console.log('Saved proxy/rewrite config (' + out2.length + ' bytes)');
                    conn.end();
                });
            });
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
