const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const salesRoute = fs.readFileSync('src/app/api/sales/route.ts', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");

const bashScript = `
#!/bin/bash
echo "Deploying Automation Phase 1: Recipe Auto-Deductions..."
for i in {1..10}
do
  echo "Injecting Sales Automation logic to n$i..."
  
  API_DIR="/www/wwwroot/n$i.namainvist.com/src/app/api/sales"
  
  mkdir -p $API_DIR
  
  echo '${salesRoute}' > $API_DIR/route.ts
  
  cd /www/wwwroot/n$i.namainvist.com
  npm run build
  pm2 reload n$i --update-env
  echo "n$i RECIPE AUTOMATION LIVE."
done
echo "MANUFACTURING AUTO-DEDUCTION ALGORITHMS SUCCESSFULLY DEPLOYED!"
`;

conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/deploy_p1.sh\n' + bashScript + '\nEOF\nbash /root/deploy_p1.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
});
