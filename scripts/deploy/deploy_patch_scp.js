const cp = require('child_process');
const scp = '"C:\\Windows\\System32\\OpenSSH\\scp.exe"';
const ssh = '"C:\\Windows\\System32\\OpenSSH\\ssh.exe"';
const key = '"C:\\Users\\1\\.ssh\\hetzner_key"';
const n1 = "root@46.4.188.170";

try {
  console.log("Direct SCP Upload...");
  // Directly uploading directory recursively
  cp.execSync(`${scp} -o StrictHostKeyChecking=no -i ${key} -r src prisma package.json ${n1}:/www/wwwroot/n1.namainvist.com/`, {stdio: 'inherit'});
  
  console.log("Rebuilding N1...");
  const cmd = `cd /www/wwwroot/n1.namainvist.com && rm -rf .next && npm run build && pm2 restart all`;
  cp.execSync(`${ssh} -o StrictHostKeyChecking=no -i ${key} ${n1} "${cmd}"`, {stdio: 'inherit'});

  console.log("Success! N1 is patched!");
} catch(e) {
  console.log("Error:", e.message);
}
