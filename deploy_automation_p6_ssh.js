const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const shiftsRoute = fs.readFileSync('src/app/api/cron/shifts/route.ts', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");
const daemonJS = fs.readFileSync('automation_daemon.js', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");

const bashScript = `
#!/bin/bash
echo "Deploying Automation Phase 6: EOD Shift Closures..."
for i in {1..10}
do
  echo "Injecting EOD CRON into n$i..."
  
  SHIFTS_DIR="/www/wwwroot/n$i.namainvist.com/src/app/api/cron/shifts"
  ROOT_DIR="/www/wwwroot/n$i.namainvist.com"
  
  mkdir -p $SHIFTS_DIR
  
  echo '${shiftsRoute}' > $SHIFTS_DIR/route.ts
  echo '${daemonJS}' > $ROOT_DIR/automation_daemon.js
  
  cd $ROOT_DIR
  npm run build
  pm2 reload n$i --update-env
  
  pm2 restart "cron-n$i"
  
  echo "n$i SHIFT CRON ACTIVE."
done
echo "EOD SHIFTS ALGORITHMS SUCCESSFULLY DEPLOYED!"
`;

conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/deploy_p6.sh\n' + bashScript + '\nEOF\nbash /root/deploy_p6.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
});
