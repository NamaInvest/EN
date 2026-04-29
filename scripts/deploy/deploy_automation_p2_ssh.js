const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const procurementRoute = fs.readFileSync('src/app/api/procurement/auto-draft/route.ts', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");
const alertsPage = fs.readFileSync('src/app/(dashboard)/warehouses/alerts/page.tsx', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");

const bashScript = `
#!/bin/bash
echo "Deploying Automation Phase 2: Procurement Auto-Drafts..."
for i in {1..10}
do
  echo "Injecting Procurement Automation to n$i..."
  
  API_DIR="/www/wwwroot/n$i.namainvist.com/src/app/api/procurement/auto-draft"
  PAGE_DIR="/www/wwwroot/n$i.namainvist.com/src/app/(dashboard)/warehouses/alerts"
  
  mkdir -p $API_DIR
  mkdir -p $PAGE_DIR
  
  echo '${procurementRoute}' > $API_DIR/route.ts
  echo '${alertsPage}' > $PAGE_DIR/page.tsx
  
  cd /www/wwwroot/n$i.namainvist.com
  npm run build
  pm2 reload n$i --update-env
  echo "n$i PROCUREMENT AUTOMATION LIVE."
done
echo "AUTO-DRAFT PURCHASING ALGORITHMS SUCCESSFULLY DEPLOYED!"
`;

conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/deploy_p2.sh\n' + bashScript + '\nEOF\nbash /root/deploy_p2.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
});
