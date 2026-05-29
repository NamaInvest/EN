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
echo "Cleaning up namainvist.com (Landing Page) to remove internal ERP files..."
cd /www/wwwroot/namainvist.com/src/app
rm -rf "(dashboard)" api auth admin login pos restaurant-pos onboarding master-panel invoice billing-expired "~offline"

echo "Rebuilding clean landing page..."
cd /www/wwwroot/namainvist.com
rm -rf .next
npm run build
pm2 restart nama-landing
echo "Clean-up and restart completed successfully!"
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
