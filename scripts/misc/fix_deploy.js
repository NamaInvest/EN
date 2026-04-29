const cp = require('child_process');
const posh = '"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"';
const scp = '"C:\\Windows\\System32\\OpenSSH\\scp.exe"';
const ssh = '"C:\\Windows\\System32\\OpenSSH\\ssh.exe"';
const key = '"C:\\Users\\1\\.ssh\\hetzner_key"';
const n1 = "root@46.4.188.170";

try {
  console.log("Zipping... (Capturing local correctly)");
  cp.execSync(`${posh} -Command "Compress-Archive -Path src, prisma, package.json -DestinationPath process_update.zip -Force"`, {stdio: 'inherit'});
  
  console.log("Uploading to N1...");
  cp.execSync(`${scp} -o StrictHostKeyChecking=no -i ${key} process_update.zip ${n1}:/www/wwwroot/n1.namainvist.com/`, {stdio: 'inherit'});
  
  console.log("Deploying N1 with cache cleared...");
  const cmd = `cd /www/wwwroot/n1.namainvist.com && unzip -o process_update.zip && npx prisma db push && rm -rf .next && npm run build && pm2 restart all`;
  cp.execSync(`${ssh} -o StrictHostKeyChecking=no -i ${key} ${n1} "${cmd}"`, {stdio: 'inherit'});

  console.log("Syncing across N2-N10...");
  const repCmd = `
for i in {2..10}; do
  DEST="/www/wwwroot/n$i.namainvist.com"
  if [ -d "$DEST" ]; then
    echo "Updating N$i..."
    cp -rf /www/wwwroot/n1.namainvist.com/src $DEST/
    cd "$DEST"
    rm -rf .next
    rm -rf prisma
    cp -r /www/wwwroot/n1.namainvist.com/prisma $DEST/
    npm run build
  fi
done
pm2 restart all
  `;
  cp.execSync(`${ssh} -o StrictHostKeyChecking=no -i ${key} ${n1} "${repCmd.replace(/\n/g, ' ')}"`, {stdio: 'inherit'});
  console.log("Successfully Fixed and Deployed everything!");
} catch(e) {
  console.log("Error:", e.message);
  process.exit(1);
}
