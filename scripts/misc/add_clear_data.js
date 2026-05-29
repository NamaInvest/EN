const { Client } = require('ssh2');

const config = {
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD',
    readyTimeout: 30000
};

const cmd = `
#!/bin/bash
set -e
conf_file="/www/server/panel/vhost/nginx/proxy/namainvist.com/namainvist.com.conf"
if [ -f "$conf_file" ]; then
    # Insert Clear-Site-Data if not exists
    if ! grep -q "Clear-Site-Data" "$conf_file"; then
        sed -i '/add_header Cache-Control no-cache;/a \\    add_header Clear-Site-Data "\\"cache\\", \\"storage\\"";' "$conf_file"
        nginx -s reload
        echo "Successfully added Clear-Site-Data header and reloaded Nginx."
    else
        echo "Header already exists."
    fi
else
    # Try all config files in the proxy dir
    for f in /www/server/panel/vhost/nginx/proxy/namainvist.com/*.conf; do
        if ! grep -q "Clear-Site-Data" "$f"; then
            sed -i '/add_header Cache-Control no-cache;/a \\    add_header Clear-Site-Data "\\"cache\\", \\"storage\\"";' "$f"
        fi
    done
    nginx -s reload
    echo "Added to all match configurations and reloaded nginx."
fi
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end());
        stream.on('data', d => process.stdout.write(d.toString()));
        stream.stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).on('error', console.error).connect(config);
