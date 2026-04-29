const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const debtsRoute = fs.readFileSync('src/app/api/cron/debts/route.ts', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");
const hrRoute = fs.readFileSync('src/app/api/cron/hr/route.ts', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");
const daemonJS = fs.readFileSync('automation_daemon.js', 'utf8').replace(/'/g, "'\\''").replace(/\$/g, "\\$");

const bashScript = `
#!/bin/bash
echo "Deploying Automation Phases 3, 4, & 5: Universal CRON Engine..."
for i in {1..10}
do
  echo "Injecting Financial & HR Master-Cron into n$i..."
  
  DEBTS_DIR="/www/wwwroot/n$i.namainvist.com/src/app/api/cron/debts"
  HR_DIR="/www/wwwroot/n$i.namainvist.com/src/app/api/cron/hr"
  ROOT_DIR="/www/wwwroot/n$i.namainvist.com"
  
  mkdir -p $DEBTS_DIR
  mkdir -p $HR_DIR
  
  echo '${debtsRoute}' > $DEBTS_DIR/route.ts
  echo '${hrRoute}' > $HR_DIR/route.ts
  echo '${daemonJS}' > $ROOT_DIR/automation_daemon.js
  
  cd $ROOT_DIR
  npm run build
  pm2 reload n$i --update-env
  
  # Check if Daemon is already running, if not start it
  pm2 describe "cron-n$i" > /dev/null
  if [ $? -eq 0 ]; then
      pm2 restart "cron-n$i"
  else
      pm2 start automation_daemon.js --name "cron-n$i"
  fi
  pm2 save
  
  echo "n$i UNIVERSAL CRON ACTIVE."
done
echo "DEBTS, HR, AND DAEMON ALGORITHMS SUCCESSFULLY DEPLOYED!"
`;

conn.on('ready', () => {
    conn.exec('cat << "EOF" > /root/deploy_p3_p5.sh\n' + bashScript + '\nEOF\nbash /root/deploy_p3_p5.sh', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
        .on('data', (d) => process.stdout.write(d.toString()))
        .stderr.on('data', (d) => process.stderr.write(d.toString()));
    });
}).connect({
    host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b',
    readyTimeout: 30000
});
