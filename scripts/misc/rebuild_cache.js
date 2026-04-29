const cp = require('child_process');
const sshExe = '"C:\\Windows\\System32\\OpenSSH\\ssh.exe"';
const key = '"C:\\Users\\1\\.ssh\\hetzner_key"';
const ip = "root@46.4.188.170";

try {
  console.log("Clearing CACHE and Building N1...");
  const cmd = `cd /www/wwwroot/n1.namainvist.com && rm -rf .next && npx next build && pm2 restart all`;
  cp.execSync(`${sshExe} -o StrictHostKeyChecking=no -i ${key} ${ip} "${cmd}"`, {stdio: 'inherit'});

  console.log("Syncing across N2-N10...");
  const repCmd = `
for i in {2..10}; do
  DEST="/www/wwwroot/n$i.namainvist.com"
  if [ -d "$DEST" ]; then
    echo "Updating N$i..."
    cp -r /www/wwwroot/n1.namainvist.com/src $DEST/
    cd "$DEST"
    rm -rf .next
    npx next build
  fi
done
pm2 restart all
  `;
  cp.execSync(`${sshExe} -o StrictHostKeyChecking=no -i ${key} ${ip} "${repCmd.replace(/\n/g, ' ')}"`, {stdio: 'inherit'});

  console.log("Success! Rebuild complete.");
} catch(e) {
  console.log("Error:", e.message);
}
