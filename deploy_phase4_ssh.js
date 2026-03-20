const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const stockTransfersRoute = fs.readFileSync('src/app/api/stock-transfers/route.ts', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");
const productStocksLocationRoute = fs.readFileSync('src/app/api/product-stocks/location/route.ts', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");
const stockPage = fs.readFileSync('src/app/(dashboard)/stock/page.tsx', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");

const bashScript = `
#!/bin/bash
echo "Deploying Phase 4: Bin Management & Transfer Constraints..."
for i in {1..10}
do
  echo "Transmitting Phase 4 to n$i..."
  
  TRANSFERS_DIR="/www/wwwroot/n$i.namainvist.com/src/app/api/stock-transfers"
  LOCATION_DIR="/www/wwwroot/n$i.namainvist.com/src/app/api/product-stocks/location"
  STOCK_DIR="/www/wwwroot/n$i.namainvist.com/src/app/(dashboard)/stock"
  
  mkdir -p $TRANSFERS_DIR
  mkdir -p $LOCATION_DIR
  mkdir -p $STOCK_DIR
  
  echo '${stockTransfersRoute}' > $TRANSFERS_DIR/route.ts
  echo '${productStocksLocationRoute}' > $LOCATION_DIR/route.ts
  echo '${stockPage}' > $STOCK_DIR/page.tsx
  
  cd /www/wwwroot/n$i.namainvist.com
  npm run build
  pm2 reload n$i --update-env
  echo "n$i PHASE 4 ALIVE."
done
echo "BIN TRACKING & TRANSFER PROTECTIONS FULLY DEPLOYED!"
`;

conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/deploy_phase4.sh\n' + bashScript + '\nEOF\nbash /root/deploy_phase4.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
});
