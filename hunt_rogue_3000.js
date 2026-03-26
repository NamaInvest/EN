const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('--- HUNTING ROGUE 3000 PORTS IN NGINX ---');
    
    // Find any files holding the dead port 3000 and force them to 2999.
    const bashScript = `
#!/bin/bash
echo "=== FILES CONTAINING PORT 3000 ==="
grep -rl "127.0.0.1:3000" /www/server/panel/vhost/nginx/

echo "=== PATCHING THEM AUTOMATICALLY ==="
for file in $(grep -rl "127.0.0.1:3000" /www/server/panel/vhost/nginx/); do
    chattr -i $file
    sed -i 's/127.0.0.1:3000/127.0.0.1:2999/g' $file
    chattr +i $file
    echo "Patched $file"
done

echo "=== RESTARTING NGINX ==="
systemctl restart nginx || /etc/init.d/nginx restart
curl -vI https://namainvist.com
    `;
    
    conn.exec(bashScript, (execErr, stream) => {
        if (execErr) throw execErr;
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
        stream.on('close', () => {
            conn.end();
        });
    });
}).connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
