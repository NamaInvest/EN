const { Client } = require('ssh2');

const bashCommand = `
echo "Deleting old PM2 instances..."
pm2 delete n1 n2 n3 n4 n5 n6 n7 n8 n9 n10 n11 2>/dev/null
pm2 delete n1-main n2-main n3-main n4-main n5-main n6-main n7-main n8-main n9-main n10-main n11-main nama-main 2>/dev/null
pm2 save

echo "Rebuilding N1 sequentially..."
cd /www/wwwroot/n1.namainvist.com
npm run build
pm2 start npm --name "tenant-n1" --cwd "/www/wwwroot/n1.namainvist.com" -- start -- -p 3001
pm2 save

echo "Rebuilding N2 to N11 in background sequentially..."
(
for i in {2..11}; do
  tenant="n$i"
  dir="/www/wwwroot/$tenant.namainvist.com"
  port=$((3000 + i))
  
  if [ -d "$dir" ]; then
    echo "Starting build and PM2 for $tenant on port $port..."
    cd "$dir"
    npm run build
    pm2 start npm --name "tenant-$tenant" --cwd "$dir" -- start -- -p "$port"
    pm2 save
  fi
done
) > rebuild_background.log 2>&1 &
echo "Script finished firing background. N1 is fully rebuilt!"
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(bashCommand, (err, stream) => {
        if (err) throw err;
        stream.on('data', (d) => process.stdout.write(d));
        stream.stderr.on('data', (d) => process.stdout.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({
    host: '46.4.188.170',
    port: 22,
    username: 'root',
    password: 'process.env.SSH_PASSWORD'
});
