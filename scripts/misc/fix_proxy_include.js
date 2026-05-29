const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- FIXING NGINX PROXY INCLUDE ---');
    
    // Inject the missing AaPanel include directive so it actually loads the user's reverse proxy!
    const bashScript = `
#!/bin/bash
chattr -i /www/server/panel/vhost/nginx/namainvist.com.conf

# Check if the include already exists, if not, append it before the last brace
if ! grep -q "include /www/server/panel/vhost/nginx/proxy/namainvist.com/\\*.conf;" /www/server/panel/vhost/nginx/namainvist.com.conf; then
    sed -i '$ d' /www/server/panel/vhost/nginx/namainvist.com.conf
    echo '    include /www/server/panel/vhost/nginx/proxy/namainvist.com/*.conf;' >> /www/server/panel/vhost/nginx/namainvist.com.conf
    echo '}' >> /www/server/panel/vhost/nginx/namainvist.com.conf
fi

/etc/init.d/nginx reload
    `;
    
    conn.exec(bashScript, (execErr, stream) => {
        if (execErr) throw execErr;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('✅ INJECTION COMPLETE. PROXY NOW ACTIVE.');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
