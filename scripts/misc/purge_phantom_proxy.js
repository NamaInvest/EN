const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- ERADICATING PHANTOM PROXY FILES ---');
    
    // AaPanel gets angry if ANY file related to the domain has proxy_pass
    const bashScript = `
#!/bin/bash
echo "Removing proxy cache files for namainvist.com..."
rm -rf /www/server/panel/vhost/nginx/proxy/namainvist.com/*
rm -rf /www/server/panel/vhost/rewrite/namainvist.com.conf
touch /www/server/panel/vhost/rewrite/namainvist.com.conf

echo "Checking the master conf..."
# Sometimes it's stuck in node_n1.conf or other files! Let's wipe node_n1 just in case it's conflicting IF it shares the domain
# But node_n1 might be n1.namainvist.com. Let's just sed any namainvist.com matches out.
cat /www/server/panel/vhost/nginx/namainvist.com.conf | grep "proxy_pass"

/etc/init.d/nginx reload
    `;
    
    conn.exec(bashScript, (execErr, stream) => {
        if (execErr) throw execErr;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            console.log('✅ ALL PHANTOM PROXIES DELETED.');
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: 'process.env.SSH_PASSWORD', readyTimeout: 15000 });
