const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const stockNotificationBell = fs.readFileSync('src/components/StockNotificationBell.tsx', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");
const layoutTsx = fs.readFileSync('src/app/(dashboard)/layout.tsx', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");

const bashScript = `
#!/bin/bash
echo "Deploying Global Stock Top-Bar Notifications..."
for i in {1..10}
do
  echo "Injecting UI into n$i..."
  
  COMPONENTS_DIR="/www/wwwroot/n$i.namainvist.com/src/components"
  LAYOUT_DIR="/www/wwwroot/n$i.namainvist.com/src/app/(dashboard)"
  
  mkdir -p $COMPONENTS_DIR
  mkdir -p $LAYOUT_DIR
  
  echo '${stockNotificationBell}' > $COMPONENTS_DIR/StockNotificationBell.tsx
  echo '${layoutTsx}' > $LAYOUT_DIR/layout.tsx
  
  cd /www/wwwroot/n$i.namainvist.com
  npm run build
  pm2 reload n$i --update-env
  echo "n$i NOTIFICATIONS ACTIVE."
done
echo "GLOBAL INVENTORY ALERTS SUCCESSFULLY DEPLOYED!"
`;

conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/deploy_bell.sh\n' + bashScript + '\nEOF\nbash /root/deploy_bell.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
});
