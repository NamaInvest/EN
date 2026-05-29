const { Client } = require('ssh2');

const bashCommand = `
for file in /etc/nginx/sites-available/*; do
  if [ -f "$file" ]; then
    # Remove existing Let's Encrypt paths
    sed -i '/ssl_certificate.*letsencrypt/d' "$file"
    sed -i '/ssl_certificate_key.*letsencrypt/d' "$file"
    sed -i '/include.*options-ssl-nginx.conf/d' "$file"
    sed -i '/ssl_dhparam.*letsencrypt/d' "$file"
    
    # Ensure they have the origin cert inside the 443 block
    if ! grep -q "origin.crt" "$file"; then
      sed -i '/listen 443 ssl/a \\
    ssl_certificate /etc/ssl/namainvist/origin.crt;\\
    ssl_certificate_key /etc/ssl/namainvist/origin.key;\\
    ssl_protocols TLSv1.2 TLSv1.3;\\
    ssl_ciphers HIGH:!aNULL:!MD5;' "$file"
    fi
  fi
done

systemctl reload nginx
`;

const conn = new Client();
conn.on('ready', () => {
    console.log('Mass updating Nginx Origin SSL...');
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d))
              .on('error', (d) => process.stderr.write(d))
              .on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD'
});
