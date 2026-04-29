const { Client } = require('ssh2');

const hostIp = '46.4.188.170';
const username = 'root';
const password = '_ee4SWbxLVfH9b';

const script = `
export PATH=$PATH:/www/server/nvm/versions/node/v24.14.0/bin
for i in {2..10}; do
  echo "======================================"
  echo "Syncing n1.namainvist.com -> n$i.namainvist.com"
  echo "======================================"
  
  # Ensure target directory exists (though it should)
  mkdir -p /www/wwwroot/n$i.namainvist.com
  
  # Rsync from n1 to nX, excluding environment/build/deps
  rsync -av --exclude='.next' --exclude='node_modules' --exclude='.env' --exclude='.git' /www/wwwroot/n1.namainvist.com/ /www/wwwroot/n$i.namainvist.com/ > /dev/null
  
  cd /www/wwwroot/n$i.namainvist.com
  
  echo "Generating Prisma for n$i..."
  npx prisma generate
  
  echo "Building Next.js for n$i..."
  npm run build
  
  echo "Restarting PM2 process for n$i..."
  pm2 restart n$i || echo "Failed to restart n$i. It might not be running in PM2."
done
echo "DONE WITH ALL SYNC TASKS."
`;

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to ' + hostIp);
    
    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('data', data => process.stdout.write(data.toString()));
        stream.stderr.on('data', data => process.stderr.write(data.toString()));
        stream.on('close', (code) => {
            console.log('\nScript finished with code', code);
            conn.end();
        });
    });
}).on('error', (err) => {
    console.error('Connection err:', err);
}).connect({ host: hostIp, port: 22, username, password, keepaliveInterval: 10000 });
