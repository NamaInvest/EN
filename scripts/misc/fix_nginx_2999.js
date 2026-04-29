const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- PATCHING NGINX TO PORT 2999 ---');
    
    // We update the Nginx vhost config to point proxy_pass to 2999
    // and then reload nginx
    const bashScript = `
#!/bin/bash
sed -i 's/proxy_pass http:\\/\\/127.0.0.1:3000;/proxy_pass http:\\/\\/127.0.0.1:2999;/g' /www/server/panel/vhost/nginx/namainvist.com.conf
nginx -t && nginx -s reload
    `;
    
    conn.exec(bashScript, (execErr, stream) => {
        if (execErr) throw execErr;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('✅ NGINX SUCCESSFULY RELOADED TO PORT 2999.');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
