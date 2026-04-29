const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const analyticsRoute = fs.readFileSync('src/app/api/warehouses/analytics/route.ts', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");
const alertsPage = fs.readFileSync('src/app/(dashboard)/warehouses/alerts/page.tsx', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");
const warehousePage = fs.readFileSync('src/app/(dashboard)/warehouses/page.tsx', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");

const bashScript = `
#!/bin/bash
echo "Deploying Phase 2 & 3: Analytics and Low Stock Alerts..."
for i in {1..10}
do
  echo "Transmitting Analytics into n$i..."
  
  API_DIR="/www/wwwroot/n$i.namainvist.com/src/app/api/warehouses/analytics"
  ALERTS_DIR="/www/wwwroot/n$i.namainvist.com/src/app/(dashboard)/warehouses/alerts"
  PAGE_DIR="/www/wwwroot/n$i.namainvist.com/src/app/(dashboard)/warehouses"
  
  mkdir -p $API_DIR
  mkdir -p $ALERTS_DIR
  mkdir -p $PAGE_DIR
  
  echo '${analyticsRoute}' > $API_DIR/route.ts
  echo '${alertsPage}' > $ALERTS_DIR/page.tsx
  echo '${warehousePage}' > $PAGE_DIR/page.tsx
  
  cd /www/wwwroot/n$i.namainvist.com
  npm run build
  pm2 reload n$i --update-env
  echo "n$i ANALYTICS ALIVE."
done
echo "ALL FINANCIAL & STOCK METRICS SUCCESSFULLY SECURED!"
`;

conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/deploy_analytics.sh\n' + bashScript + '\nEOF\nbash /root/deploy_analytics.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
});
