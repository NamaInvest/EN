const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const username = 'root';
const password = 'process.env.SSH_PASSWORD';

const bashScript = `#!/bin/bash
export PATH=$PATH:/www/server/nvm/versions/node/v24.14.0/bin

echo "=== STARTING FULL CLONE OF N1 TO N2..N10 ==="

for i in {2..10}; do
  echo "----------------------------------------"
  echo "Applying Phase 1-5 Updates to n$i.namainvist.com..."
  
  rm -rf /www/wwwroot/n$i.namainvist.com/src /www/wwwroot/n$i.namainvist.com/prisma
  
  cp -r /www/wwwroot/n1.namainvist.com/src /www/wwwroot/n$i.namainvist.com/
  cp -r /www/wwwroot/n1.namainvist.com/prisma /www/wwwroot/n$i.namainvist.com/
  cp /www/wwwroot/n1.namainvist.com/package.json /www/wwwroot/n$i.namainvist.com/
  
  cd /www/wwwroot/n$i.namainvist.com
  
  npm install
  
  echo "[n$i] Generating Prisma Client..."
  npx prisma generate
  
  echo "[n$i] Clearing Cache & Building Next.js..."
  rm -rf .next
  npm run build
  
  echo "[n$i] Restarting PM2 process..."
  pm2 restart n$i || echo "Warning: could not restart n$i via PM2"
  
  echo "Done synchronizing n$i.namainvist.com!"
done

echo "=== ALL SUBDOMAINS CLONED SUCCESSFULLY ==="
`;

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected directly to VPS: ' + hostIp);
    
    conn.exec(bashScript, (err, stream) => {
        if (err) throw err;
        stream.on('data', data => process.stdout.write(data.toString()));
        stream.stderr.on('data', data => process.stderr.write(data.toString()));
        stream.on('close', (code) => {
            console.log('\nMass Clone Script finished with code', code);
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('Connection err:', err);
}).connect({ host: hostIp, port: 22, username, password, keepaliveInterval: 10000 });
