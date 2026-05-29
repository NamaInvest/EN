const { Client } = require('ssh2');
const bashCommand = `
sudo -u postgres psql -d ice_db -c "GRANT ALL ON SCHEMA public TO ice_db;"
cd /www/wwwroot/ice.namainvist.com
npx prisma db push --accept-data-loss
node inject_settings.js
pm2 start npm --name "ice" -- start -- -p 3012
pm2 save
systemctl reload nginx
certbot --nginx -d ice.namainvist.com --non-interactive --agree-tos -m ialqrashi62@gmail.com --redirect
`;

const conn = new Client();
conn.on('ready', () => {
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
