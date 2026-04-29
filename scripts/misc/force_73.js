const cp = require('child_process');
const sshExe = '"C:\\Windows\\System32\\OpenSSH\\ssh.exe"';
const scpExe = '"C:\\Windows\\System32\\OpenSSH\\scp.exe"';
const key = '"C:\\Users\\1\\.ssh\\hetzner_key"';
const ip = "root@46.4.188.170";

try {
  console.log("Creating specific directory...");
  cp.execSync(`${sshExe} -o StrictHostKeyChecking=no -i ${key} ${ip} "mkdir -p /www/wwwroot/n1.namainvist.com/src/app/\\(dashboard\\)/reports/73-modules"`, {stdio: 'inherit'});
  
  console.log("SCP standard upload directly to N1...");
  cp.execSync(`${scpExe} -o StrictHostKeyChecking=no -i ${key} "src/app/(dashboard)/reports/73-modules/page.tsx" ${ip}:/www/wwwroot/n1.namainvist.com/src/app/\\(dashboard\\)/reports/73-modules/page.tsx`, {stdio: 'inherit'});
  
  console.log("Clearing CACHE and Building N1...");
  // Clear .next cache to ensure the new route is discovered
  const cmd = `cd /www/wwwroot/n1.namainvist.com && rm -rf .next && npm run build && pm2 restart all`;
  cp.execSync(`${sshExe} -o StrictHostKeyChecking=no -i ${key} ${ip} "${cmd}"`, {stdio: 'inherit'});

  console.log("Syncing across N2-N10...");
  const repCmd = `
for i in {2..10}; do
  DEST="/www/wwwroot/n$i.namainvist.com"
  if [ -d "$DEST" ]; then
    echo "Updating N$i..."
    mkdir -p "$DEST/src/app/\\(dashboard\\)/reports/73-modules"
    cp /www/wwwroot/n1.namainvist.com/src/app/\\(dashboard\\)/reports/73-modules/page.tsx "$DEST/src/app/\\(dashboard\\)/reports/73-modules/page.tsx"
    cd "$DEST"
    rm -rf .next
    npm run build
  fi
done
pm2 restart all
  `;
  cp.execSync(`${sshExe} -o StrictHostKeyChecking=no -i ${key} ${ip} "${repCmd.replace(/\n/g, ' ')}"`, {stdio: 'inherit'});

  console.log("Success!");
} catch(e) {
  console.log("Error:", e.message);
}
