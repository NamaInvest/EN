const cp = require('child_process');
const ssh = '"C:\\Windows\\System32\\OpenSSH\\ssh.exe"';
const key = '"C:\\Users\\1\\.ssh\\hetzner_key"';
const n1 = "root@46.4.188.170";

try {
  console.log("Syncing across N2-N10 securely...");
  // Use properly formatted inline bash without removing newlines
  const scriptContent = `
set -e
for i in {2..10}; do
  DEST="/www/wwwroot/n$i.namainvist.com"
  if [ -d "$DEST" ]; then
    echo "Updating N$i..."
    rm -rf "$DEST/src"
    cp -r /www/wwwroot/n1.namainvist.com/src "$DEST/"
    rm -rf "$DEST/prisma"
    cp -r /www/wwwroot/n1.namainvist.com/prisma "$DEST/"
    cd "$DEST"
    rm -rf .next
    npm run build
  fi
done
pm2 restart all
  `;
  cp.execSync(`${ssh} -o StrictHostKeyChecking=no -i ${key} ${n1} "bash -s"`, {
    input: scriptContent,
    stdio: ['pipe', 'inherit', 'inherit']
  });
  console.log("Successfully Synced N2-N10!");
} catch(e) {
  console.log("Error:", e.message);
}
